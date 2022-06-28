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
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NameGeneratorService} from '@core/services/name-generator';
import {NodeDataService} from '@core/services/node-data/service';
import {SettingsService} from '@core/services/settings';
import {ContainerRuntime, END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION} from '@shared/entity/cluster';
import {FeatureGateService} from '@core/services/feature-gate';
import {Datacenter} from '@shared/entity/datacenter';
import {OperatingSystemSpec, Taint} from '@shared/entity/node';
import {NodeProvider, NodeProviderConstants, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, of} from 'rxjs';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';

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
  // Used only when in dialog mode.
  @Input() showExtended = false;
  labels: object = {};
  taints: Taint[] = [];
  featureGateOperatingSystemManagerEnabled: boolean;
  dialogEditMode = false;
  endOfDynamicKubeletConfigSupportVersion: string = END_OF_DYNAMIC_KUBELET_CONFIG_SUPPORT_VERSION;

  get providerDisplayName(): string {
    return NodeProviderConstants.displayName(this.provider);
  }

  get showOperatingSystemProfile(): boolean {
    return (
      this._clusterSpecService.cluster.spec.enableOperatingSystemManager &&
      this.featureGateOperatingSystemManagerEnabled
    );
  }

  get isDynamicKubletConfigSupported(): boolean {
    return this._clusterSpecService.cluster.spec.version < this.endOfDynamicKubeletConfigSupportVersion;
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nameGenerator: NameGeneratorService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _settingsService: SettingsService,
    private readonly _featureGatesService: FeatureGateService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
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
      [Controls.OperatingSystemProfile]: this._builder.control(this._nodeDataService.nodeData.operatingSystemProfile, [
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
    });

    if (this.isDialogView()) {
      this.form.addControl(Controls.Kubelet, this._builder.control(''));
      this.dialogEditMode = !!this._nodeDataService.nodeData.name;
    }

    if (this.dialogEditMode) {
      this.form.get(Controls.Name).disable();
      this.form.get(Controls.OperatingSystemProfile).disable();
    }

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterSpecService.providerChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.get(Controls.OperatingSystem).setValue(this._getDefaultOS()));

    this._clusterSpecService.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      delete this._nodeDataService.nodeData.spec.cloud[this.provider];
      this.provider = this._clusterSpecService.provider;
    });

    merge(this._clusterSpecService.datacenterChanges, of(this._clusterSpecService.datacenter))
      .pipe(filter(dc => !!dc))
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(tap(dc => (this._datacenterSpec = dc)))
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

    this._settingsService.adminSettings.pipe(take(1)).subscribe(settings => {
      const replicas = this.dialogEditMode ? this._nodeDataService.nodeData.count : settings.defaultNodeCount;
      this.form.get(Controls.Count).setValue(replicas);
    });

    this._featureGatesService.featureGates
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(featureGates => (this.featureGateOperatingSystemManagerEnabled = featureGates.operatingSystemManager));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isProvider(...provider: NodeProvider[]): boolean {
    return provider.includes(this.provider);
  }

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
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.OPENSTACK,
          NodeProvider.ANEXIA,
          NodeProvider.KUBEVIRT,
          NodeProvider.VSPHERE
        );
      case OperatingSystem.Ubuntu:
        return !this.isProvider(NodeProvider.ANEXIA);
      case OperatingSystem.CentOS:
        return !this.isProvider(NodeProvider.ANEXIA, NodeProvider.GCP);
      case OperatingSystem.RockyLinux:
        return this.isProvider(
          NodeProvider.HETZNER,
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.DIGITALOCEAN,
          NodeProvider.VSPHERE,
          NodeProvider.OPENSTACK,
          NodeProvider.KUBEVIRT
        );
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

  private _init(): void {
    let upgradeOnBoot = false;
    let disableAutoUpdate = false;

    switch (this._nodeDataService.operatingSystem) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
      case OperatingSystem.SLES:
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

  private _getOperatingSystemSpec(): OperatingSystemSpec {
    switch (this.form.get(Controls.OperatingSystem).value) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
      case OperatingSystem.SLES:
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

  // Ubuntu otherwise
  private _getDefaultSystemTemplate(provider: NodeProvider): OperatingSystem {
    switch (provider) {
      case NodeProvider.VSPHERE: {
        return this._datacenterSpec.spec.vsphere.templates
          ? (Object.keys(this._datacenterSpec.spec.vsphere.templates)[0] as OperatingSystem)
          : OperatingSystem.Ubuntu;
      }
    }

    return OperatingSystem.Ubuntu;
  }

  private _getDefaultOS(): OperatingSystem {
    if (this.isOperatingSystemSupported(this._nodeDataService.operatingSystem)) {
      return this._nodeDataService.operatingSystem;
    }

    if (this.isProvider(NodeProvider.ANEXIA)) {
      return OperatingSystem.Flatcar;
    }

    if (this._datacenterSpec) {
      return this._getDefaultSystemTemplate(this.provider);
    }

    return OperatingSystem.Ubuntu;
  }

  private _getNodeData(): NodeData {
    return {
      count: this.form.get(Controls.Count).value,
      name: this.form.get(Controls.Name).value,
      dynamicConfig: this.form.get(Controls.DynamicConfig).value,
      operatingSystemProfile: this.form.get(Controls.OperatingSystemProfile).value,
    } as NodeData;
  }
}
