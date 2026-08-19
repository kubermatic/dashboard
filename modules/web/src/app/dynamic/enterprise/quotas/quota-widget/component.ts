//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  HostListener,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import {QuotaCalculationService} from '../services/quota-calculation';
import {debounceTime, take, takeUntil, map, filter} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {QuotaDetails, QuotaVariables, ResourceQuotaCalculation} from '@shared/entity/quota';
import {getPercentage} from '@shared/utils/common';
import {Member} from '@shared/entity/member';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {FeatureGateService} from '@core/services/feature-gate';
import {UserService} from '@core/services/user';
import {QuotaService} from '../service';
import {DEFAULT_DEBOUNCE_TIME_MS, quotaWidgetCollapsibleWidth} from '@shared/constants/common';
import {getProgressBarAccent} from '../utils/common';

const MAX_DISPLAYED_ACCELERATORS = 3;

@Component({
  selector: 'km-quota-widget',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class QuotaWidgetComponent implements OnInit, OnChanges, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounceTime = DEFAULT_DEBOUNCE_TIME_MS;
  private readonly _showDetails$ = new BehaviorSubject(false);
  private readonly _getPercentage = getPercentage;
  private _user: Member;

  estimatedQuota: ResourceQuotaCalculation;

  @Input() projectId = '';
  @Input() showQuotaWidgetDetails = false;
  @Input() showAsCard = true;
  @Input() showIcon = true;
  @Input() showDetailsOnHover = true;
  @Input() isExternalCluster = false;
  @Input() isImportedCluster = false;
  @Input() isKubeOneCluster = false;
  @Input() showBorderOutline = true;
  @Input() collapsible = false;
  @Input() projectViewType = '';
  // Node provider of the context this widget is shown in (e.g. the wizard's/MD dialog's currently
  // selected provider). Accelerator quotas only ever apply to KubeVirt, so when this is set to a
  // different provider the accelerator section is hidden even if the project has GPU limits from
  // an unrelated KubeVirt cluster. Unset = no such context (e.g. project cards/list, admin table)
  // - accelerator info is shown regardless of provider.
  @Input() provider: NodeProvider;
  // Accelerator resource names relevant to a specific context (e.g. the currently selected
  // KubeVirt instance type in a machine deployment dialog/wizard). undefined = no such context;
  // always fall back to showing only the most-used accelerator. Set but empty = the current
  // selection has no accelerators; same fallback applies.
  @Input() relevantAcceleratorNames: string[];
  @Output() estimatedQuotaExceeded = new EventEmitter<boolean>();

  quotaPercentage: QuotaVariables;
  estimatedQuotaPercentage: QuotaVariables;
  hasAcceleratorQuotaFeature = false;
  acceleratorPercentages: Record<string, number> = {};
  estimatedAcceleratorPercentages: Record<string, number> = {};
  isEstimatedQuotaExceeded: boolean;
  quotaDetails: QuotaDetails;
  showWarning: boolean;
  isWidgetApplicableForExternalOrImportedCluster: boolean;
  showDetails$ = this._showDetails$.asObservable().pipe(debounceTime(this._debounceTime));
  calculationInProgress$: Observable<boolean>;
  isCollapsed: boolean;
  getProgressBarAccent = getProgressBarAccent;

  readonly quotaLimit = 100;

  @HostListener('mouseover') onMouseOver(): void {
    if (!this.showDetailsOnHover) return;

    this._showDetails$.next(this.hasQuota());
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    if (!this.showDetailsOnHover) return;

    this._showDetails$.next(false);
  }

  @HostListener('window:resize', ['$event']) onResize(event): void {
    this.isCollapsed = event.target.innerWidth <= quotaWidgetCollapsibleWidth && this.collapsible;
  }

  get hasCpuQuota(): boolean {
    const quota = this.quotaDetails?.quota;
    return quota && !!(quota.cpu || quota.cpu === 0);
  }
  get hasMemoryQuota(): boolean {
    const quota = this.quotaDetails?.quota;
    return quota && !!(quota.memory || quota.memory === 0);
  }
  get hasStorageQuota(): boolean {
    const quota = this.quotaDetails?.quota;
    return quota && !!(quota.storage || quota.storage === 0);
  }

  // Accelerator quotas only apply to the KubeVirt provider (the only one that can populate them
  // today). When this widget is scoped to a specific provider (wizard/MD dialog) and that provider
  // isn't KubeVirt, accelerator info is irrelevant even if the project has GPU limits from an
  // unrelated KubeVirt cluster.
  get isAcceleratorProviderApplicable(): boolean {
    return !this.provider || this.provider === NodeProvider.KUBEVIRT;
  }

  get acceleratorResourceNames(): string[] {
    if (!this.hasAcceleratorQuotaFeature || !this.isAcceleratorProviderApplicable) {
      return [];
    }
    const resources = this.quotaDetails?.quota?.accelerators?.[0]?.resources;
    return resources ? Object.keys(resources) : [];
  }

  get hasAcceleratorQuota(): boolean {
    return this.acceleratorResourceNames.length > 0;
  }

  // The accelerator resource name with the highest current usage/limit percentage, based on
  // current usage always (never the estimate) - used as the fallback single bar wherever showing
  // every accelerator isn't appropriate.
  get mostUsedAcceleratorName(): string {
    return this.acceleratorResourceNames.reduce(
      (best, name) => (this.getAcceleratorPercentage(name) > this.getAcceleratorPercentage(best) ? name : best),
      this.acceleratorResourceNames[0]
    );
  }

  // Accelerator resource names to render as compact/summary bars. Never shown in any project-list
  // context (projectViewType set - cards or table view): those layouts are too narrow/high-density
  // for accelerator bars, but the hover detail popup (acceleratorResourceNames) still lists every
  // accelerator there. Otherwise, when relevantAcceleratorNames names a non-empty set of resources
  // that actually have a quota entry, show exactly those (e.g. an MD dialog/wizard showing only what
  // the selected instance type will consume) - capped at MAX_DISPLAYED_ACCELERATORS, highest usage
  // first, if the selection uses more than that. Otherwise (no such context, or the current
  // selection has no accelerators) fall back to a single "most used" bar.
  get displayedAcceleratorNames(): string[] {
    if (this.projectViewType) {
      return [];
    }
    const relevant = this.relevantAcceleratorNames?.filter(name => this.acceleratorResourceNames.includes(name)) ?? [];
    const names = relevant.length ? relevant : this.mostUsedAcceleratorName ? [this.mostUsedAcceleratorName] : [];
    return [...names]
      .sort((a, b) => this.getAcceleratorPercentage(b) - this.getAcceleratorPercentage(a))
      .slice(0, MAX_DISPLAYED_ACCELERATORS);
  }

  get classForQuotaDetailInSelectProjectView(): string {
    if (this.projectViewType) {
      return `quota-detail-project-${this.projectViewType}-view`;
    }
    return '';
  }

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _userService: UserService,
    private readonly _quotaService: QuotaService,
    private readonly _quotaCalculationService: QuotaCalculationService,
    private readonly _featureGateService: FeatureGateService
  ) {}

  ngOnInit(): void {
    this.isCollapsed = window.innerWidth <= quotaWidgetCollapsibleWidth && this.collapsible;
    this.calculationInProgress$ = this._quotaCalculationService.calculationInProgress;
    this._initSubscriptions();
    this._setShowNotApplicableText();

    this._featureGateService.featureGates.pipe(takeUntil(this._unsubscribe)).subscribe(featureGates => {
      this.hasAcceleratorQuotaFeature = !!featureGates.kubeVirtAcceleratorQuota;
      if (this.quotaDetails) {
        this._setQuotaPercentages(this.quotaDetails);
        this._setShowWarningIcon();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.projectId) {
      this._unsubscribe.next();
      this._subscribeToQuotaDetails();
    }

    if (changes.isExternalCluster || changes.isImportedCluster) {
      this._setShowNotApplicableText();
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  hasQuota(): boolean {
    const quota = this.quotaDetails?.quota;
    return (quota && !!(quota.cpu || quota.memory || quota.storage)) || this.hasAcceleratorQuota;
  }

  getAcceleratorQuota(resourceName: string): number {
    return Number(this.quotaDetails?.quota?.accelerators?.[0]?.resources?.[resourceName] ?? 0);
  }

  getAcceleratorUsage(resourceName: string): number {
    return Number(this.quotaDetails?.status?.globalUsage?.accelerators?.[0]?.resources?.[resourceName] ?? 0);
  }

  getAcceleratorPercentage(resourceName: string): number {
    return this.acceleratorPercentages?.[resourceName] ?? 0;
  }

  getEstimatedAcceleratorPercentage(resourceName: string): number {
    return this.estimatedAcceleratorPercentages?.[resourceName];
  }

  getEstimatedAcceleratorUsage(resourceName: string): number {
    return Number(this.estimatedQuota?.calculatedQuota?.accelerators?.[0]?.resources?.[resourceName] ?? 0);
  }

  getExtendedProgressBarTooltip(currentUsage: number, estimatedUsage: number): string {
    if (currentUsage || currentUsage === 0 || estimatedUsage) {
      if (estimatedUsage) {
        return `Current Usage: ${currentUsage || 0}%, Estimated Usage: ${estimatedUsage}%`;
      } else if (currentUsage) {
        return `${currentUsage}%`;
      }
    }
    return '';
  }

  updateEstimatedQuota(quota: ResourceQuotaCalculation): void {
    if (!quota) {
      this.estimatedQuota = null;
      this.estimatedQuotaPercentage = null;
      this.estimatedAcceleratorPercentages = {};
      this.isEstimatedQuotaExceeded = false;
      this.estimatedQuotaExceeded.emit(false);
      return;
    }

    this.estimatedQuota = quota;
    const calculatedQuota = this.estimatedQuota?.calculatedQuota;
    this._setEstimatedQuotaPercentages(quota);

    if (calculatedQuota) {
      const {cpu, memory, storage} = calculatedQuota;
      let isExceeded = false;

      if (cpu > this.quotaDetails.quota?.cpu) {
        isExceeded = true;
      }
      if (memory > this.quotaDetails.quota?.memory) {
        isExceeded = true;
      }
      if (storage > this.quotaDetails.quota?.storage) {
        isExceeded = true;
      }
      if (this._acceleratorExceedsQuota(calculatedQuota)) {
        isExceeded = true;
      }

      this.isEstimatedQuotaExceeded = isExceeded;
      this.estimatedQuotaExceeded.emit(isExceeded);
    }
  }

  private _acceleratorExceedsQuota(calculatedQuota: QuotaVariables): boolean {
    if (!this.hasAcceleratorQuotaFeature || !this.isAcceleratorProviderApplicable) {
      return false;
    }
    const limitResources = this.quotaDetails?.quota?.accelerators?.[0]?.resources ?? {};
    const calculatedResources = calculatedQuota?.accelerators?.[0]?.resources ?? {};
    return Object.keys(limitResources).some(
      name => Number(calculatedResources[name] ?? 0) > Number(limitResources[name])
    );
  }

  private _initSubscriptions(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => {
      this._user = user;

      this._subscribeToQuotaDetails();
    });
  }

  private _subscribeToQuotaDetails(): void {
    const quota$ = this._user.isAdmin
      ? this._quotaService.quotas.pipe(map(quotas => quotas.find(({subjectName}) => subjectName === this.projectId)))
      : this._quotaService.getLiveProjectQuota(this.projectId);

    quota$.pipe(filter(Boolean), takeUntil(this._unsubscribe)).subscribe(quotaDetails => {
      this.quotaDetails = quotaDetails;
      this._setQuotaPercentages(this.quotaDetails);
      this._setShowWarningIcon();
      this._cdr.detectChanges();
    });
  }

  private _setQuotaPercentages(quotaDetails: QuotaDetails): void {
    const totalQuota = quotaDetails.quota;
    const usage = quotaDetails.status.globalUsage;
    this.quotaPercentage = this._getQuotaPercentage(totalQuota, usage);
    this.acceleratorPercentages = this._getAcceleratorPercentages(totalQuota, usage);
  }

  private _getAcceleratorPercentages(total: QuotaVariables, usage: QuotaVariables): Record<string, number> {
    if (!this.hasAcceleratorQuotaFeature || !this.isAcceleratorProviderApplicable) {
      return {};
    }
    const totalResources = total?.accelerators?.[0]?.resources ?? {};
    const usageResources = usage?.accelerators?.[0]?.resources ?? {};

    return Object.keys(totalResources).reduce(
      (percentages, resourceName) => {
        percentages[resourceName] = this.getValidNumber(
          this._getPercentage(Number(totalResources[resourceName]), Number(usageResources[resourceName] ?? 0))
        );
        return percentages;
      },
      {} as Record<string, number>
    );
  }

  private _setEstimatedQuotaPercentages(estimatedQuota: ResourceQuotaCalculation): void {
    const totalQuota = estimatedQuota?.resourceQuota?.quota;
    const estimatedUsage = estimatedQuota?.calculatedQuota;
    this.estimatedQuotaPercentage = this._getQuotaPercentage(totalQuota, estimatedUsage);
    this.estimatedAcceleratorPercentages = this._getAcceleratorPercentages(totalQuota, estimatedUsage);
  }

  private _getQuotaPercentage(total: QuotaVariables, usage: QuotaVariables): QuotaVariables {
    const cpu = this.getValidNumber(this._getPercentage(total.cpu, usage.cpu)) ?? 0;
    const memory = this.getValidNumber(this._getPercentage(total.memory, usage.memory)) ?? 0;
    const storage = this.getValidNumber(this._getPercentage(total.storage, usage.storage)) ?? 0;
    return {cpu, memory, storage};
  }

  private getValidNumber(num: number): number {
    if (isNaN(num)) {
      return 0;
    }
    return num;
  }

  private _setShowWarningIcon(): void {
    const exceedsLimit = (percentage: number): boolean => percentage > this.quotaLimit;
    this.showWarning =
      Object.values(this.quotaPercentage).some(exceedsLimit) ||
      Object.values(this.acceleratorPercentages).some(exceedsLimit);
    this._quotaService.setQuotaExceeded(this.showWarning);
  }

  private _setShowNotApplicableText(): void {
    this.isWidgetApplicableForExternalOrImportedCluster =
      this.isExternalCluster || this.isImportedCluster || this.isKubeOneCluster;
  }
}
