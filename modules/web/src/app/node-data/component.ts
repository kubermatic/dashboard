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
  TemplateRef,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {OperatingSystemManagerService} from '@core/services/operating-system-manager';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {AutocompleteControls} from '@shared/components/autocomplete/component';
import {ContainerRuntime, END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {OperatingSystemSpec, Taint} from '@shared/entity/node';
import {NodeProvider, NodeProviderConstants, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, of} from 'rxjs';
import {filter, finalize, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ParamsService, PathParam} from '@core/services/params';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {OperatingSystemProfile} from '@shared/entity/operating-system-profile';
import {DynamicModule} from '@dynamic/module-registry';
import {AsyncValidators} from '@app/shared/validators/async.validators';
import {ResourceType} from '@app/shared/entity/common';

enum Controls {
  Name = 'name',
  Count = 'count',
  DynamicConfig = 'dynamicConfig',
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
})
export class NodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _datacenterSpec: Datacenter;
  readonly NodeProvider = NodeProvider;
  readonly Controls = Controls;
  readonly OperatingSystem = OperatingSystem;
  @Input() provider: NodeProvider;
  @Input() quotaWidget: TemplateRef<QuotaWidgetComponent>;
  labels: object = {};
  taints: Taint[] = [];
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.MachineDeployment)];
  selectedOperatingSystemProfile: string;
  supportedOperatingSystemProfiles: string[] = [];
  operatingSystemProfiles: OperatingSystemProfile[] = [];
  operatingSystemProfileValidators = [KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR];
  dialogEditMode = false;
  projectId: string;
  endOfDynamicKubeletConfigSupportVersion: string = END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION;
  isLoadingOSProfiles: boolean;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;

  private _enableOperatingSystemManager: boolean;
  private isCusterTemplateEditMode = false;

  get providerDisplayName(): string {
    return NodeProviderConstants.displayName(this.provider);
  }

  get isOperatingSystemManagerEnabled(): boolean {
    return this._clusterSpecService.cluster.spec.enableOperatingSystemManager;
  }

  get isDynamicKubeletConfigSupported(): boolean {
    return this._clusterSpecService.cluster.spec.version < this.endOfDynamicKubeletConfigSupportVersion;
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
    private readonly _params: ParamsService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.projectId = this._params.get(PathParam.ProjectID);
    this.selectedOperatingSystemProfile = this._nodeDataService.nodeData.operatingSystemProfile;
    this.isCusterTemplateEditMode = this._clusterSpecService.clusterTemplateEditMode;

    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._nodeDataService.nodeData.name, [
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
      [Controls.Count]: this._builder.control(this._nodeDataService.nodeData.count),
      [Controls.DynamicConfig]: this._builder.control(this._nodeDataService.nodeData.dynamicConfig),
      [Controls.OperatingSystem]: this._builder.control(this._getDefaultOS(), [Validators.required]),
      [Controls.UpgradeOnBoot]: this._builder.control(false),
      [Controls.DisableAutoUpdate]: this._builder.control(false),
      [Controls.RhelSubscriptionManagerUser]: this._builder.control(''),
      [Controls.RhelSubscriptionManagerPassword]: this._builder.control(''),
      [Controls.RhelOfflineToken]: this._builder.control(''),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
      [Controls.OperatingSystemProfile]: this._builder.control({
        main: this.selectedOperatingSystemProfile || '',
      }),
    });

    if (this.isDialogView()) {
      this.form.addControl(Controls.Kubelet, this._builder.control(''));
      this.dialogEditMode = !!this._nodeDataService.nodeData.name;

      if (this.dialogEditMode) {
        this.form.get(Controls.Name).disable();
      } else {
        this._nodeDataService.operatingSystemSpec = this._getOperatingSystemSpec();
      }
    }

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterSpecService.providerChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.get(Controls.OperatingSystem).setValue(this._getDefaultOS()));

    this._clusterSpecService.providerChanges
      .pipe(filter(_ => !this.isCusterTemplateEditMode))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        delete this._nodeDataService.nodeData.spec.cloud[this.provider];
        this.provider = this._clusterSpecService.provider;
      });

    this._clusterSpecService.clusterChanges
      .pipe(
        filter(_ => {
          if (this._enableOperatingSystemManager === this.isOperatingSystemManagerEnabled) {
            return false;
          }
          this._enableOperatingSystemManager = this.isOperatingSystemManagerEnabled;
          return this.isOperatingSystemManagerEnabled;
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._loadOperatingSystemProfiles();
        this.isCusterTemplateEditMode = this._clusterSpecService.clusterTemplateEditMode;
        if (this.isDynamicKubeletConfigSupported) {
          this.form.get(Controls.DynamicConfig).enable();
        } else {
          this.form.get(Controls.DynamicConfig).disable();
        }
      });

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(tap(dc => (this._datacenterSpec = dc)))
      .pipe(tap(() => this._loadOperatingSystemProfiles()))
      .subscribe(_ => this.form.get(Controls.OperatingSystem).setValue(this._getDefaultOS()));

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Count).valueChanges,
      this.form.get(Controls.DynamicConfig).valueChanges,
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

    merge(this.form.get(Controls.OperatingSystem).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        // We don't want to retain the existing value for OSP in the edit view since user explicitly
        // changed the selected operating system.
        this.selectedOperatingSystemProfile = null;
        this.supportedOperatingSystemProfiles = this.getSupportedOperatingSystemProfiles();
        this.setDefaultOperatingSystemProfiles();
      });

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      const replicas =
        this.dialogEditMode || this.isCusterTemplateEditMode
          ? this._nodeDataService.nodeData.count
          : settings.defaultNodeCount;
      this.form.get(Controls.Count).setValue(replicas);
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
      case OperatingSystem.SLES:
        // SLES only supports docker as container runtime
        return (
          this._clusterSpecService.cluster.spec.containerRuntime === ContainerRuntime.Docker &&
          this.isProvider(NodeProvider.AWS)
        );
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
          NodeProvider.EQUINIX,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK,
          NodeProvider.VSPHERE
        );
      case OperatingSystem.Ubuntu:
        return !this.isProvider(NodeProvider.ANEXIA);
      case OperatingSystem.CentOS:
        return !this.isProvider(NodeProvider.ANEXIA, NodeProvider.GCP, NodeProvider.VMWARECLOUDDIRECTOR);
      case OperatingSystem.RockyLinux:
        return this.isProvider(
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.DIGITALOCEAN,
          NodeProvider.EQUINIX,
          NodeProvider.HETZNER,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK,
          NodeProvider.VSPHERE
        );
      case OperatingSystem.AmazonLinux2:
        return this.isProvider(NodeProvider.AWS);
    }
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

  onLabelsChange(labels: object): void {
    this.labels = labels;
    this._nodeDataService.labels = this.labels;
  }

  onTaintsChange(taints: Taint[]): void {
    this.taints = taints;
    this._nodeDataService.taints = this.taints;
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.projectId = this.projectId;
    component.showQuotaWidgetDetails = true;
    component.showIcon = true;
  }

  private _init(): void {
    let upgradeOnBoot = false;
    let disableAutoUpdate = false;

    switch (this._nodeDataService.operatingSystem) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
      case OperatingSystem.SLES:
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
    this.onTaintsChange(this._nodeDataService.nodeData.spec.taints);

    this.form.get(Controls.UpgradeOnBoot).setValue(!!upgradeOnBoot);
    this.form.get(Controls.DisableAutoUpdate).setValue(!!disableAutoUpdate);

    this._cdr.detectChanges();
  }

  private _loadOperatingSystemProfiles() {
    if (this.isOperatingSystemManagerEnabled) {
      this.isLoadingOSProfiles = true;
      const profiles$ = this.isDialogView()
        ? this._projectService.selectedProject.pipe(take(1)).pipe(
            switchMap(project => {
              return this._osmService.getOperatingSystemProfilesForCluster(
                this._clusterSpecService.cluster.id,
                project.id
              );
            })
          )
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
  }

  private _getOperatingSystemSpec(): OperatingSystemSpec {
    switch (this.form.get(Controls.OperatingSystem).value) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
      case OperatingSystem.SLES:
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

  private _getDefaultSystemTemplate(provider: NodeProvider): OperatingSystem | null {
    switch (provider) {
      case NodeProvider.VSPHERE: {
        return this._datacenterSpec.spec.vsphere.templates
          ? (Object.keys(this._datacenterSpec.spec.vsphere.templates)[0] as OperatingSystem)
          : null;
      }
    }

    return null;
  }

  private _getDefaultOS(): OperatingSystem {
    if (this.isOperatingSystemSupported(this._nodeDataService.operatingSystem)) {
      return this._nodeDataService.operatingSystem;
    }

    if (this._datacenterSpec) {
      const defaultSystemTemplateOS = this._getDefaultSystemTemplate(this.provider);
      if (defaultSystemTemplateOS) {
        return defaultSystemTemplateOS;
      }
    }

    let defaultOS = OperatingSystem.Ubuntu;
    if (this.isProvider(NodeProvider.ANEXIA)) {
      defaultOS = OperatingSystem.Flatcar;
    }

    if (!this.isOperatingSystemSupported(defaultOS)) {
      defaultOS = Object.values(OperatingSystem).find(os => this.isOperatingSystemSupported(os));
    }

    return defaultOS;
  }

  private _getNodeData(): NodeData {
    return {
      count: this.form.get(Controls.Count).value,
      name: this.form.get(Controls.Name).value,
      dynamicConfig: this.form.get(Controls.DynamicConfig).value,
      operatingSystemProfile: this.form.get(Controls.OperatingSystemProfile).value?.[AutocompleteControls.Main],
    } as NodeData;
  }

  private getSupportedOperatingSystemProfiles(): string[] {
    return this.operatingSystemProfiles
      .filter(osp => osp.operatingSystem === this.form.get(Controls.OperatingSystem).value.toLowerCase())
      .filter(
        // Packet was renamed to EquinixMetal for the machines.
        osp =>
          osp.supportedCloudProviders.indexOf(this.provider === NodeProvider.EQUINIX ? 'equinixmetal' : this.provider) >
          -1
      )
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
}
