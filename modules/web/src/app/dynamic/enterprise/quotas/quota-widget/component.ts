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
import {UserService} from '@core/services/user';
import {QuotaService} from '../service';
import {quotaWidgetCollapsibleWidth} from '@shared/constants/common';
import {getProgressBarAccent} from '../utils/common';

@Component({
    selector: 'km-quota-widget',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class QuotaWidgetComponent implements OnInit, OnChanges, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private readonly _debounce = 500;
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
  @Output() estimatedQuotaExceeded = new EventEmitter<boolean>();

  quotaPercentage: QuotaVariables;
  estimatedQuotaPercentage: QuotaVariables;
  isEstimatedQuotaExceeded: boolean;
  quotaDetails: QuotaDetails;
  showWarning: boolean;
  isWidgetApplicableForExternalOrImportedCluster: boolean;
  showDetails$ = this._showDetails$.asObservable().pipe(debounceTime(this._debounce));
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
    private readonly _quotaCalculationService: QuotaCalculationService
  ) {}

  ngOnInit(): void {
    this.isCollapsed = window.innerWidth <= quotaWidgetCollapsibleWidth && this.collapsible;
    this.calculationInProgress$ = this._quotaCalculationService.calculationInProgress;
    this._initSubscriptions();
    this._setShowNotApplicableText();
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
    return quota && !!(quota.cpu || quota.memory || quota.storage);
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

      this.isEstimatedQuotaExceeded = isExceeded;
      this.estimatedQuotaExceeded.emit(isExceeded);
    }
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
  }

  private _setEstimatedQuotaPercentages(estimatedQuota: ResourceQuotaCalculation): void {
    const totalQuota = estimatedQuota?.resourceQuota?.quota;
    const estimatedUsage = estimatedQuota?.calculatedQuota;
    this.estimatedQuotaPercentage = this._getQuotaPercentage(totalQuota, estimatedUsage);
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
    this.showWarning = Object.values(this.quotaPercentage).some((quota: number) => quota > this.quotaLimit);
    this._quotaService.setQuotaExceeded(this.showWarning);
  }

  private _setShowNotApplicableText(): void {
    this.isWidgetApplicableForExternalOrImportedCluster =
      this.isExternalCluster || this.isImportedCluster || this.isKubeOneCluster;
  }
}
