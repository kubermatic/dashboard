import {ChangeDetectionStrategy, Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';
import {DatacenterService} from '../core/services';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {ClusterType} from '../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../shared/entity/DatacenterEntity';
import {OperatingSystemSpec, Taint} from '../shared/entity/NodeEntity';
import {NodeProvider, NodeProviderConstants, OperatingSystem} from '../shared/model/NodeProviderConstants';
import {NodeData} from '../shared/model/NodeSpecChange';
import {ClusterService} from '../shared/services/cluster.service';
import {BaseFormValidator} from '../shared/validators/base-form.validator';
import {NoIpsLeftValidator} from '../shared/validators/no-ips-left.validator';
import {NodeDataService} from './service/service';

enum Controls {
  Name = 'name',
  Count = 'count',
  DynamicConfig = 'dynamicConfig',
  OperatingSystem = 'operatingSystem',
  UpgradeOnBoot = 'upgradeOnBoot',
  DisableAutoUpdate = 'disableAutoUpdate',
  RhelSubscriptionManagerUser = 'rhelSubscriptionManagerUser',
  RhelSubscriptionManagerPassword = 'rhelSubscriptionManagerPassword',
  RhsmOfflineToken = 'rhsmOfflineToken',
  ProviderBasic = 'providerBasic',
  ProviderExtended = 'providerExtended',
  Kubelet = 'kubelet',
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
  private _datacenterSpec: DataCenterEntity;

  readonly NodeProvider = NodeProvider;
  readonly Controls = Controls;
  readonly OperatingSystem = OperatingSystem;

  @Input() provider: NodeProvider;
  // Used only when in dialog mode.
  @Input() showExtended = false;
  @Input() existingNodesCount = 0;

  labels: object = {};
  taints: Taint[] = [];
  dialogEditMode = false;

  get providerDisplayName(): string {
    return NodeProviderConstants.displayName(this.provider);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nameGenerator: ClusterNameGenerator,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    const replicas = this._nodeDataService.nodeData.count ? this._nodeDataService.nodeData.count : 1;

    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this._nodeDataService.nodeData.name, [
        Validators.pattern('[a-zA-Z0-9-]*'),
      ]),
      [Controls.Count]: this._builder.control(replicas, [
        Validators.required,
        Validators.min(0),
        NoIpsLeftValidator(this._clusterService.cluster.spec.machineNetworks, this.existingNodesCount),
      ]),
      [Controls.DynamicConfig]: this._builder.control(this._nodeDataService.nodeData.dynamicConfig),
      [Controls.OperatingSystem]: this._builder.control(this._getDefaultOS(), [Validators.required]),
      [Controls.UpgradeOnBoot]: this._builder.control(false),
      [Controls.DisableAutoUpdate]: this._builder.control(false),
      [Controls.RhelSubscriptionManagerUser]: this._builder.control(''),
      [Controls.RhelSubscriptionManagerPassword]: this._builder.control(''),
      [Controls.RhsmOfflineToken]: this._builder.control(''),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
    });

    if (this.isDialogView()) {
      this.form.addControl(Controls.Kubelet, this._builder.control(''));
      this.dialogEditMode = !!this._nodeDataService.nodeData.name;
    }

    if (this.dialogEditMode) {
      this.form.get(Controls.Name).disable();
    }

    this._nodeDataService.nodeData = this._getNodeData();
    this.labels = this._nodeDataService.nodeData.spec.labels;
    this.taints = this._nodeDataService.nodeData.spec.taints;

    merge(this._clusterService.clusterTypeChanges, this._clusterService.providerChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.get(Controls.OperatingSystem).setValue(this._getDefaultOS()));

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
      .pipe(takeUntil(this._unsubscribe))
      .pipe(tap(dc => (this._datacenterSpec = dc)))
      .subscribe(_ => this.form.get(Controls.OperatingSystem).setValue(this._getDefaultOS()));

    this.form
      .get(Controls.OperatingSystem)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(os => {
        if (os !== OperatingSystem.RHEL) {
          this.form.get(Controls.RhelSubscriptionManagerUser).clearValidators();
          this.form.get(Controls.RhelSubscriptionManagerPassword).clearValidators();
          this.form.get(Controls.RhelSubscriptionManagerUser).updateValueAndValidity();
          this.form.get(Controls.RhelSubscriptionManagerPassword).updateValueAndValidity();
        }
      });

    merge(
      this.form.get(Controls.Name).valueChanges,
      this.form.get(Controls.Count).valueChanges,
      this.form.get(Controls.DynamicConfig).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    merge(
      this.form.get(Controls.OperatingSystem).valueChanges,
      this.form.get(Controls.UpgradeOnBoot).valueChanges,
      this.form.get(Controls.DisableAutoUpdate).valueChanges,
      this.form.get(Controls.RhelSubscriptionManagerUser).valueChanges,
      this.form.get(Controls.RhelSubscriptionManagerPassword).valueChanges,
      this.form.get(Controls.RhsmOfflineToken).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.operatingSystemSpec = this._getOperatingSystemSpec()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isProvider(...provider: NodeProvider[]): boolean {
    return provider.includes(this.provider);
  }

  isOpenshiftCluster(): boolean {
    return this._clusterService.clusterType === ClusterType.OpenShift;
  }

  isOperatingSystemSupported(os: OperatingSystem): boolean {
    // Disable unsupported systems when Openshift is used
    if (
      this.isOpenshiftCluster() &&
      [
        OperatingSystem.Flatcar,
        OperatingSystem.SLES,
        OperatingSystem.ContainerLinux,
        OperatingSystem.Ubuntu,
        OperatingSystem.RHEL,
      ].includes(os)
    ) {
      return false;
    }

    // If VSphere is selected enable OS only if it is also defined in the datacenter spec
    if (this._hasSystemTemplate(NodeProvider.VSPHERE, os)) {
      return true;
    }

    // Enable OS per-provider basis
    switch (os) {
      case OperatingSystem.ContainerLinux:
        return this.isProvider(
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.DIGITALOCEAN,
          NodeProvider.GCP,
          NodeProvider.KUBEVIRT,
          NodeProvider.PACKET,
          NodeProvider.OPENSTACK
        );
      case OperatingSystem.SLES:
        return this.isProvider(NodeProvider.AWS);
      case OperatingSystem.RHEL:
        return this.isProvider(
          NodeProvider.AWS,
          NodeProvider.AZURE,
          NodeProvider.GCP,
          NodeProvider.KUBEVIRT,
          NodeProvider.OPENSTACK
        );
      case OperatingSystem.Flatcar:
        return this.isProvider(NodeProvider.AWS, NodeProvider.AZURE);
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
        return !this.isProvider(NodeProvider.VSPHERE);
    }

    return false;
  }

  isOperatingSystemSelected(os: OperatingSystem): boolean {
    return this.form.get(Controls.OperatingSystem).value === os;
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

  private _getOperatingSystemSpec(): OperatingSystemSpec {
    switch (this.form.get(Controls.OperatingSystem).value) {
      case OperatingSystem.Ubuntu:
      case OperatingSystem.CentOS:
      case OperatingSystem.SLES:
        return {
          [this.form.get(Controls.OperatingSystem).value]: {
            distUpgradeOnBoot: this.form.get(Controls.UpgradeOnBoot).value,
          },
        };
      case OperatingSystem.ContainerLinux:
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
            rhsmOfflineToken: this.form.get(Controls.RhsmOfflineToken).value,
          },
        };
      default:
        return {ubuntu: {distUpgradeOnBoot: false}};
    }
  }

  private _hasSystemTemplate(provider: NodeProvider, os: OperatingSystem): boolean {
    if (!this._datacenterSpec) {
      return false;
    }

    // Map Container Linux to CoreOS template
    if (os === OperatingSystem.ContainerLinux) {
      os = OperatingSystem.CoreOS;
    }

    switch (provider) {
      case NodeProvider.VSPHERE: {
        const vSphereSpec = this._datacenterSpec.spec.vsphere;
        const templates = vSphereSpec ? Object.keys(vSphereSpec.templates) : [];
        return templates.includes(os);
      }
      default: {
        return false;
      }
    }
  }

  // Ubuntu otherwise
  private _getDefaultSystemTemplate(provider: NodeProvider): OperatingSystem {
    switch (provider) {
      case NodeProvider.VSPHERE: {
        const defaultTemplate = this._datacenterSpec.spec.vsphere.templates
          ? (Object.keys(this._datacenterSpec.spec.vsphere.templates)[0] as OperatingSystem)
          : OperatingSystem.Ubuntu;
        return defaultTemplate === OperatingSystem.CoreOS ? OperatingSystem.ContainerLinux : defaultTemplate;
      }
    }

    return OperatingSystem.Ubuntu;
  }

  private _getDefaultOS(): OperatingSystem {
    if (this._nodeDataService.operatingSystem) {
      return this._nodeDataService.operatingSystem;
    }

    if (this.isOpenshiftCluster()) {
      return OperatingSystem.CentOS;
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
    } as NodeData;
  }
}
