// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ResourceType} from '@app/shared/entity/common';
import {AdminSettings, DEFAULT_ADMIN_SETTINGS} from '@app/shared/entity/settings';
import {AsyncValidators} from '@app/shared/validators/async.validators';
import {
  IPV4_IPV6_CIDR_PATTERN,
  IPV4_IPV6_PATTERN,
  KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
} from '@app/shared/validators/others';
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {ApplicationService} from '@core/services/application';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {OperatingSystemManagerService} from '@core/services/operating-system-manager';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {DynamicModule} from '@dynamic/module-registry';
import {AutocompleteControls} from '@shared/components/autocomplete/component';
import {
  Application,
  ApplicationDefinition,
  CLUSTER_AUTOSCALING_APP_DEF_NAME,
  createApplicationInstallation,
} from '@shared/entity/application';
import {Datacenter} from '@shared/entity/datacenter';
import {NodeNetworkSpec, OperatingSystemSpec, Taint} from '@shared/entity/node';
import {OperatingSystemProfile} from '@shared/entity/operating-system-profile';
import {ResourceQuotaCalculation, ResourceQuotaCalculationPayload} from '@shared/entity/quota';
import {NodeProvider, NodeProviderConstants, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, forkJoin, merge, of} from 'rxjs';
import {debounceTime, filter, finalize, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import _ from 'lodash';
import {ParamsService, PathParam} from '@app/core/services/params';
import {EditApplicationDialogComponent} from '@app/shared/components/application-list/edit-application-dialog/component';
import {MatDialog} from '@angular/material/dialog';

enum Controls {
  Name = 'name',
  Count = 'count',
  OperatingSystem = 'operatingSystem',
  UpgradeOnBoot = 'upgradeOnBoot',
  DisableAutoUpdate = 'disableAutoUpdate',
  RhelSubscriptionManagerUser = 'rhelSubscriptionManagerUser',
  RhelSubscriptionManagerPassword = 'rhelSubscriptionManagerPassword',
  RhelOfflineToken = 'rhelOfflineToken',
  ProviderBasic = 'providerBasic',
  ProviderExtended = 'providerExtended',
  Kubelet = 'kubelet',
  OperatingSystemProfile = 'operatingSystemProfile',
  EnableClusterAutoscalingApp = 'enableClusterAutoscalingApp',
  MaxReplicas = 'maxReplicas',
  MinReplicas = 'minReplicas',
  StaticNetworkDNSServers = 'DNSServers',
  StaticNetworkGateway = 'gateway',
  StaticNetworkCIDR = 'CIDR',
}

enum ClusterAutoscalingWarning {
  NotInCatalog = 'To configure autoscaling, the Cluster Autoscaler application must be present in the applications catalog.',
  NotInstalled = 'To configure autoscaling, the Cluster Autoscaler application needs to be installed on the cluster',
}

@Component({
  selector: 'km-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => NodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class NodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounce = 500;
  private _datacenterSpec: Datacenter;
  readonly NodeProvider = NodeProvider;
  readonly Controls = Controls;
  readonly OperatingSystem = OperatingSystem;
  readonly minReplicasCount = 0;
  readonly maxReplicasCount = 1000;
  readonly autoscalerMinReplicasCount = 1;
  readonly ipv4AndIPv6Regex = IPV4_IPV6_PATTERN;

  @Input() provider: NodeProvider;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  machineDeploymentAnnotations: Record<string, string>;
  taints: Taint[] = [];
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.MachineDeployment)];
  selectedOperatingSystemProfile: string;
  supportedOperatingSystemProfiles: string[] = [];
  operatingSystemProfiles: OperatingSystemProfile[] = [];
  operatingSystemProfileValidators = [KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR];
  dialogEditMode = false;
  projectId: string;
  isLoadingOSProfiles: boolean;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  wizardMode: WizardMode;
  currentNodeOS: OperatingSystem;
  allowedOperatingSystems = DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems;
  DNSServers: string[] = [];
  clusterAutoscalerAppDefinition: ApplicationDefinition;
  autoscalerApplication: Application;
  clusterAutoscalerWarningMessage: string;

  private isCusterTemplateEditMode = false;
  private quotaWidgetComponentRef: QuotaWidgetComponent;

  get providerDisplayName(): string {
    return NodeProviderConstants.displayName(this.provider);
  }

  get displayQuotaInWizard(): boolean {
    return this.wizardMode === WizardMode.CustomizeClusterTemplate || !this.wizardMode;
  }

  get nodeHasAdvanceSettings(): boolean {
    return NodeProviderConstants.nodeHasAdvanceSettings(this._clusterSpecService.provider);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _settingsService: SettingsService,
    private readonly _osmService: OperatingSystemManagerService,
    private readonly _projectService: ProjectService,
    private readonly _quotaCalculationService: QuotaCalculationService,
    private readonly _applicationService: ApplicationService,
    private readonly _params: ParamsService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _matDialog: MatDialog
  ) {
    super();
  }

  @ViewChild('quotaWidgetContainer', {read: ViewContainerRef}) set quotaWidgetContainer(ref: ViewContainerRef) {
    if (ref && this.isEnterpriseEdition && !this.quotaWidgetComponentRef) {
      this.quotaWidgetComponentRef = ref.createComponent(QuotaWidgetComponent).instance;
      this.quotaWidgetComponentRef.projectId = this.projectId;
      this.quotaWidgetComponentRef.showQuotaWidgetDetails = true;
      this.quotaWidgetComponentRef.showIcon = true;
      this.quotaWidgetComponentRef.estimatedQuotaExceeded
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((quotaExceeded: boolean) => {
          this._quotaCalculationService.refreshQuotaExceed(quotaExceeded);
        });

      this._quotaCalculationService
        .getQuotaCalculations(this.projectId, this.provider)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((calculatedQuota: ResourceQuotaCalculation) => {
          this.quotaWidgetComponentRef.updateEstimatedQuota(calculatedQuota);
        });
    }
  }

  ngOnInit(): void {
    this.wizardMode = window.history.state?.mode;
    this.projectId = this._params.get(PathParam.ProjectID);
    this.selectedOperatingSystemProfile = this._nodeDataService.nodeData.operatingSystemProfile;
    this.isCusterTemplateEditMode = this._clusterSpecService.clusterTemplateEditMode;

    this.autoscalerApplication = this._applicationService.applications.find(
      app => app.spec.applicationRef.name === CLUSTER_AUTOSCALING_APP_DEF_NAME
    );

    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._nodeDataService.nodeData.name, [
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.Count]: this._builder.control(this._nodeDataService.nodeData.count),
      [Controls.OperatingSystem]: this._builder.control(this._getDefaultOS(), [Validators.required]),
      [Controls.UpgradeOnBoot]: this._builder.control(false),
      [Controls.DisableAutoUpdate]: this._builder.control(false),
      [Controls.RhelSubscriptionManagerUser]: this._builder.control(''),
      [Controls.RhelSubscriptionManagerPassword]: this._builder.control(''),
      [Controls.RhelOfflineToken]: this._builder.control(''),
      [Controls.StaticNetworkDNSServers]: this._builder.control(
        this._nodeDataService.nodeData?.spec.network?.dns?.servers || []
      ),
      [Controls.StaticNetworkGateway]: this._builder.control(
        this._nodeDataService.nodeData?.spec.network?.gateway || '',
        [Validators.pattern(IPV4_IPV6_PATTERN)]
      ),
      [Controls.StaticNetworkCIDR]: this._builder.control(this._nodeDataService.nodeData?.spec.network?.cidr || '', [
        Validators.pattern(IPV4_IPV6_CIDR_PATTERN),
      ]),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
      [Controls.OperatingSystemProfile]: this._builder.control({
        main: this.selectedOperatingSystemProfile || '',
      }),
      [Controls.EnableClusterAutoscalingApp]: this._builder.control(!!this.autoscalerApplication),
      [Controls.MaxReplicas]: this._builder.control(
        this._nodeDataService.nodeData.maxReplicas,
        Validators.max(this.maxReplicasCount)
      ),
      [Controls.MinReplicas]: this._builder.control(
        this._nodeDataService.nodeData.minReplicas,
        Validators.min(this.autoscalerMinReplicasCount)
      ),
    });

    if (this.isDialogView()) {
      this.form.addControl(Controls.Kubelet, this._builder.control(''));
      this.dialogEditMode = !!this._nodeDataService.nodeData.name;

      this._applicationService.list(this.projectId, this._clusterSpecService.cluster.id).subscribe(apps => {
        this.autoscalerApplication = apps.find(
          app => app.spec.applicationRef.name === CLUSTER_AUTOSCALING_APP_DEF_NAME
        );
        if (!this.autoscalerApplication?.name) {
          this.clusterAutoscalerWarningMessage = ClusterAutoscalingWarning.NotInstalled;
          this.form.get(Controls.EnableClusterAutoscalingApp).setValue(false);
          this.form.get(Controls.EnableClusterAutoscalingApp).disable();
        }
      });

      if (this.dialogEditMode) {
        this.form.get(Controls.Name).disable();
      } else {
        this._nodeDataService.operatingSystemSpec = this._getOperatingSystemSpec();
      }
    } else {
      this._applicationService
        .getApplicationDefinition(CLUSTER_AUTOSCALING_APP_DEF_NAME)
        .pipe(take(1))
        .subscribe(appdef => {
          if (appdef.name) {
            this.clusterAutoscalerAppDefinition = appdef;
            this.autoscalerApplication = this.autoscalerApplication ?? createApplicationInstallation(appdef);
          } else {
            this.form.get(Controls.EnableClusterAutoscalingApp).setValue(false);
            this.form.get(Controls.EnableClusterAutoscalingApp).disable();
            this.clusterAutoscalerWarningMessage = ClusterAutoscalingWarning.NotInCatalog;
          }
        });
    }

    this.currentNodeOS = (this.dialogEditMode || this.wizardMode) && this._nodeDataService.operatingSystem;

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._setDefaultOS());

    this._clusterSpecService.providerChanges
      .pipe(filter(_ => !this.isCusterTemplateEditMode))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        delete this._nodeDataService.nodeData.spec.cloud[this.provider];
        this.provider = this._clusterSpecService.provider;

        const mapKey = `${this.projectId}-${this.provider}`;
        this._quotaCalculationService.reset(mapKey);
      });

    this._clusterSpecService.clusterChanges
      .pipe(debounceTime(this._debounce))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.isCusterTemplateEditMode = this._clusterSpecService.clusterTemplateEditMode;
        this._loadOperatingSystemProfiles();
      });

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(tap(dc => (this._datacenterSpec = dc)))
      .pipe(tap(() => this._loadOperatingSystemProfiles()))
      .subscribe(_ => this._setDefaultOS());

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Count).valueChanges,
      this.form.get(Controls.EnableClusterAutoscalingApp).valueChanges,
      this.form.get(Controls.MaxReplicas).valueChanges,
      this.form.get(Controls.MinReplicas).valueChanges,
      this.form.get(Controls.OperatingSystemProfile).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    merge(
      this.form.get(Controls.OperatingSystem).valueChanges,
      this.form.get(Controls.UpgradeOnBoot).valueChanges,
      this.form.get(Controls.DisableAutoUpdate).valueChanges,
      this.form.get(Controls.RhelSubscriptionManagerUser).valueChanges,
      this.form.get(Controls.RhelSubscriptionManagerPassword).valueChanges,
      this.form.get(Controls.RhelOfflineToken).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.operatingSystemSpec = this._getOperatingSystemSpec()));

    merge(
      this.form.get(Controls.OperatingSystem).valueChanges,
      this.form.get(Controls.StaticNetworkDNSServers).valueChanges,
      this.form.get(Controls.StaticNetworkGateway).valueChanges,
      this.form.get(Controls.StaticNetworkCIDR).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.network = this.getStaticNetworkSpec()));

    merge(this.form.get(Controls.OperatingSystem).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        // We don't want to retain the existing value for OSP in the edit view since user explicitly
        // changed the selected operating system.
        this.selectedOperatingSystemProfile = null;
        this.supportedOperatingSystemProfiles = this.getSupportedOperatingSystemProfiles();
        this.setDefaultOperatingSystemProfiles();
      });

    forkJoin([
      this._settingsService.adminSettings.pipe(take(1)),
      this._projectService.selectedProject.pipe(take(1)),
    ]).subscribe(([settings, project]) => {
      this.allowedOperatingSystems = {...settings.allowedOperatingSystems};
      const projectOS = project?.spec?.allowedOperatingSystems;
      if (!_.isEmpty(projectOS)) {
        Object.keys(this.allowedOperatingSystems)
          .filter(os => this.allowedOperatingSystems[os])
          .forEach(os => {
            this.allowedOperatingSystems[os] = projectOS[os] ?? false;
          });
      }
      this._setDefaultOS();
      this._manageMDAutoUpdate(settings);
    });

    merge(this.form.get(Controls.Count).valueChanges)
      .pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        if (Object.keys(payload).length > 1) {
          this._quotaCalculationService.refreshQuotaCalculations(payload);
        }
      });

    this.form
      .get(Controls.EnableClusterAutoscalingApp)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(enable => {
        this._updateAutoscalerApplication(enable);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isProvider(...provider: NodeProvider[]): boolean {
    return provider.includes(this.provider);
  }

  // Source of truth for supported operating system: https://github.com/kubermatic/machine-controller/blob/main/docs/operating-system.md
  isOperatingSystemSupported(os: OperatingSystem): boolean {
    // Enable OS per-provider basis
    switch (os) {
      case OperatingSystem.RHEL:
        return this.isProvider(
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK,
          NodeProvider.VSPHERE
        );
      case OperatingSystem.Flatcar:
        return this.isProvider(
          NodeProvider.ANEXIA,
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.GCP,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK,
          NodeProvider.VSPHERE,
          NodeProvider.VMWARECLOUDDIRECTOR
        );
      case OperatingSystem.Ubuntu:
        return !this.isProvider(NodeProvider.ANEXIA);
      case OperatingSystem.RockyLinux:
        return this.isProvider(
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.DIGITALOCEAN,
          NodeProvider.HETZNER,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK,
          NodeProvider.VSPHERE
        );
      case OperatingSystem.AmazonLinux2:
        return this.isProvider(NodeProvider.AWS);
    }
  }

  isOperatingSystemAllowed(os: OperatingSystem): boolean {
    if (this.dialogEditMode || this.wizardMode !== WizardMode.CreateClusterTemplate) {
      return this.isOperatingSystemSupported(os) && (this.allowedOperatingSystems[os] || this.currentNodeOS === os);
    }
    return this.isOperatingSystemSupported(os) && this.allowedOperatingSystems[os];
  }

  isOperatingSystemSelected(...os: OperatingSystem[]): boolean {
    return os.includes(this.form.get(Controls.OperatingSystem).value);
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  isDialogView(): boolean {
    // In the wizard we do not split extended and basic options.
    return !this._nodeDataService.isInWizardMode();
  }

  onLabelsChange(labels: Record<string, string>): void {
    this.labels = labels;
    this._nodeDataService.labels = this.labels;
  }

  onAnnotationsChange(annotations: Record<string, string>): void {
    this.annotations = annotations;
    this._nodeDataService.annotations = this.annotations;
  }

  onMachineDeploymentAnnotationsChange(annotations: Record<string, string>): void {
    this.machineDeploymentAnnotations = annotations;
    this._nodeDataService.machineDeploymentAnnotations = this.machineDeploymentAnnotations;
  }

  onTaintsChange(taints: Taint[]): void {
    this.taints = taints;
    this._nodeDataService.taints = this.taints;
  }

  onDNSServerChange(ips: string[]): void {
    this.DNSServers = ips;
  }

  onEditAutoScalerApp(): void {
    const dialog = this._matDialog.open(EditApplicationDialogComponent);
    dialog.componentInstance.application = this.autoscalerApplication;
    dialog.componentInstance.applicationDefinition = this.clusterAutoscalerAppDefinition;
    dialog.componentInstance.cluster = this._clusterSpecService.cluster;
    dialog.componentInstance.projectID = this.projectId;
    dialog
      .afterClosed()
      .pipe(take(1))
      .subscribe((app: Application) => {
        if (app) {
          this._filterOutAutoscalerApp();
          this._applicationService.applications = [...this._applicationService.applications, app];
          this.autoscalerApplication = app;
        }
      });
  }

  isClusterAutoscalingEnabled(): boolean {
    return !!this.clusterAutoscalerAppDefinition || (this.isDialogView() && !!this.autoscalerApplication);
  }

  isMinMaxReplicasDisabled(): boolean {
    return (
      (this.isDialogView() && !this.autoscalerApplication) ||
      (!this.isDialogView() && !this.form.get(Controls.EnableClusterAutoscalingApp).value)
    );
  }

  private _init(): void {
    let upgradeOnBoot = false;
    let disableAutoUpdate = false;

    switch (this._nodeDataService.operatingSystem) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.AmazonLinux2:
      case OperatingSystem.RHEL:
      case OperatingSystem.RockyLinux:
        upgradeOnBoot =
          this._nodeDataService.operatingSystemSpec[this._nodeDataService.operatingSystem].distUpgradeOnBoot;
        break;
      case OperatingSystem.Flatcar:
        disableAutoUpdate =
          this._nodeDataService.operatingSystemSpec[this._nodeDataService.operatingSystem].disableAutoUpdate;
    }

    this.onLabelsChange(this._nodeDataService.nodeData.spec.labels);
    this.onAnnotationsChange(this._nodeDataService.nodeData.spec.annotations);
    this.onTaintsChange(this._nodeDataService.nodeData.spec.taints);
    this.onMachineDeploymentAnnotationsChange(this._nodeDataService.nodeData.annotations);
    this.form.get(Controls.UpgradeOnBoot).setValue(!!upgradeOnBoot);
    this.form.get(Controls.DisableAutoUpdate).setValue(!!disableAutoUpdate);

    this._cdr.detectChanges();
  }

  private _setDefaultOS() {
    const defaultOS = this._getDefaultOS();
    if (defaultOS !== this.form.get(Controls.OperatingSystem).value) {
      this.form.get(Controls.OperatingSystem).setValue(defaultOS);
    }
  }

  private _manageMDAutoUpdate(settings: AdminSettings): void {
    const autoUpdatesEnabled = settings.machineDeploymentOptions.autoUpdatesEnabled;
    const replicas =
      this.dialogEditMode || this.isCusterTemplateEditMode
        ? this._nodeDataService.nodeData.count
        : settings.defaultNodeCount;

    this.form.get(Controls.Count).setValue(replicas);
    if (this.dialogEditMode) {
      if (autoUpdatesEnabled && settings.machineDeploymentOptions.autoUpdatesEnforced) {
        if (!this.form.get(Controls.UpgradeOnBoot).value) {
          this.form.get(Controls.UpgradeOnBoot).setValue(autoUpdatesEnabled);
        }
        if (this.form.get(Controls.DisableAutoUpdate).value) {
          this.form.get(Controls.DisableAutoUpdate).setValue(!autoUpdatesEnabled);
        }
      }
    } else {
      this.form.get(Controls.UpgradeOnBoot).setValue(autoUpdatesEnabled);
      this.form.get(Controls.DisableAutoUpdate).setValue(!autoUpdatesEnabled);
    }
    if (settings.machineDeploymentOptions.autoUpdatesEnforced) {
      this.form.get(Controls.UpgradeOnBoot).disable();
      this.form.get(Controls.DisableAutoUpdate).disable();
    }
  }

  private _loadOperatingSystemProfiles() {
    this.isLoadingOSProfiles = true;
    const profiles$ = this.isDialogView()
      ? this._osmService.getOperatingSystemProfilesForCluster(this._clusterSpecService.cluster.id, this.projectId)
      : this._datacenterSpec?.spec
        ? this._osmService.getOperatingSystemProfilesForSeed(this._datacenterSpec.spec.seed)
        : EMPTY;

    profiles$
      .pipe(takeUntil(this._unsubscribe))
      .pipe(take(1))
      .pipe(finalize(() => (this.isLoadingOSProfiles = false)))
      .subscribe(profiles => {
        this.operatingSystemProfiles = profiles;
        this.supportedOperatingSystemProfiles = this.getSupportedOperatingSystemProfiles();
        this.setDefaultOperatingSystemProfiles();
      });
  }

  private _getOperatingSystemSpec(): OperatingSystemSpec {
    switch (this.form.get(Controls.OperatingSystem).value) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.AmazonLinux2:
      case OperatingSystem.RockyLinux:
        return {
          [this.form.get(Controls.OperatingSystem).value]: {
            distUpgradeOnBoot: this.form.get(Controls.UpgradeOnBoot).value,
          },
        };
      case OperatingSystem.Flatcar:
        return {
          [this.form.get(Controls.OperatingSystem).value]: {
            disableAutoUpdate: this.form.get(Controls.DisableAutoUpdate).value,
          },
        };
      case OperatingSystem.RHEL:
        return {
          rhel: {
            distUpgradeOnBoot: this.form.get(Controls.UpgradeOnBoot).value,
            rhelSubscriptionManagerUser: this.form.get(Controls.RhelSubscriptionManagerUser).value,
            rhelSubscriptionManagerPassword: this.form.get(Controls.RhelSubscriptionManagerPassword).value,
            rhsmOfflineToken: this.form.get(Controls.RhelOfflineToken).value,
          },
        };
      default:
        return {ubuntu: {distUpgradeOnBoot: false}};
    }
  }

  private getStaticNetworkSpec(): NodeNetworkSpec {
    if (this.form.get(Controls.OperatingSystem).value !== OperatingSystem.Flatcar) {
      return null;
    }

    return {
      cidr: this.form.get(Controls.StaticNetworkCIDR).value,
      dns: {
        servers: this.form.get(Controls.StaticNetworkDNSServers).value?.tags,
      },
      gateway: this.form.get(Controls.StaticNetworkGateway).value,
    };
  }

  private _getDefaultSystemTemplate(provider: NodeProvider): OperatingSystem | null {
    if (provider === NodeProvider.VSPHERE) {
      const ubuntuExists = this._datacenterSpec.spec.vsphere.templates?.[OperatingSystem.Ubuntu];

      if (ubuntuExists && this.allowedOperatingSystems[OperatingSystem.Ubuntu]) {
        return OperatingSystem.Ubuntu;
      }

      return this._datacenterSpec.spec.vsphere.templates
        ? (Object.keys(this._datacenterSpec.spec.vsphere.templates)[0] as OperatingSystem)
        : null;
    }
    return null;
  }

  private _getDefaultOS(): OperatingSystem {
    if (this.dialogEditMode || (this.wizardMode && this.wizardMode !== WizardMode.CreateClusterTemplate)) {
      return this._nodeDataService.operatingSystem;
    }

    if (this._datacenterSpec) {
      const defaultSystemTemplateOS = this._getDefaultSystemTemplate(this.provider);
      if (defaultSystemTemplateOS && this.allowedOperatingSystems[defaultSystemTemplateOS]) {
        return defaultSystemTemplateOS;
      }
    }

    let defaultOS = this.allowedOperatingSystems[OperatingSystem.Ubuntu] ? OperatingSystem.Ubuntu : undefined;
    if (this.isProvider(NodeProvider.ANEXIA)) {
      defaultOS = OperatingSystem.Flatcar;
    }

    if (!this.isOperatingSystemSupported(defaultOS)) {
      defaultOS = Object.values(OperatingSystem).find(
        os => this.isOperatingSystemSupported(os) && this.allowedOperatingSystems[os]
      );
    }

    return defaultOS;
  }

  private _getNodeData(): NodeData {
    let data: NodeData = {
      name: this.form.get(Controls.Name).value,
      count: this.isProvider(NodeProvider.EDGE)
        ? 0
        : this.isProvider(NodeProvider.BAREMETAL)
          ? 1
          : this.form.get(Controls.Count).value,
      dynamicConfig: false,
      operatingSystemProfile: this.form.get(Controls.OperatingSystemProfile).value?.[AutocompleteControls.Main],
    } as NodeData;

    if (!this.isProvider(NodeProvider.EDGE, NodeProvider.BAREMETAL)) {
      data = {
        ...data,
        maxReplicas: this.form.get(Controls.MaxReplicas).value ?? null,
        minReplicas: this.form.get(Controls.MinReplicas).value ?? null,
      };
    }

    return data;
  }

  private getSupportedOperatingSystemProfiles(): string[] {
    let cloudProvider = this.provider.toString();
    if (this.provider === NodeProvider.GCP) {
      // For machines, GCP needs to be replaced with gce.
      cloudProvider = 'gce';
    } else if (this.provider === NodeProvider.VMWARECLOUDDIRECTOR) {
      // For machines, vmwareclouddirector needs to be replaced with vmware-cloud-director.
      cloudProvider = 'vmware-cloud-director';
    }

    return this.operatingSystemProfiles
      .filter(osp => osp.operatingSystem === this.form.get(Controls.OperatingSystem).value?.toLowerCase())
      .filter(osp => osp.supportedCloudProviders.indexOf(cloudProvider) > -1)
      .map(osp => osp.name);
  }

  private setDefaultOperatingSystemProfiles(): void {
    let ospValue = '';
    const selectedOperatingSystem = this.form.get(Controls.OperatingSystem).value;
    const dcOSP = this._datacenterSpec?.spec.operatingSystemProfiles?.[selectedOperatingSystem];

    if (this.selectedOperatingSystemProfile) {
      ospValue = this.selectedOperatingSystemProfile;
    } else if (dcOSP) {
      if (this.supportedOperatingSystemProfiles.indexOf(dcOSP) > -1) {
        ospValue = dcOSP;
      }
    } else if (selectedOperatingSystem !== '') {
      const ospName = 'osp-' + selectedOperatingSystem;
      if (this.supportedOperatingSystemProfiles.indexOf(ospName) > -1) {
        ospValue = ospName;
      }
    }

    this.form.get(Controls.OperatingSystemProfile).setValue({main: ospValue});
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    return {
      ...this._quotaCalculationService.quotaPayload,
      replicas: this._nodeDataService.nodeData.count,
    };
  }

  private _updateAutoscalerApplication(enable: boolean): void {
    const hasAutoscalerApp = this._applicationService.applications.some(
      app => app.spec.applicationRef.name === CLUSTER_AUTOSCALING_APP_DEF_NAME
    );

    if (enable && !hasAutoscalerApp && this.autoscalerApplication) {
      this._applicationService.applications = [...this._applicationService.applications, this.autoscalerApplication];
    } else if (!enable && hasAutoscalerApp) {
      this._filterOutAutoscalerApp();
      this.form.get(Controls.MaxReplicas).setValue(null);
      this.form.get(Controls.MinReplicas).setValue(null);
    }
  }
  private _filterOutAutoscalerApp(): void {
    this._applicationService.applications = this._applicationService.applications.filter(
      app => app.spec.applicationRef.name !== CLUSTER_AUTOSCALING_APP_DEF_NAME
    );
  }
}
