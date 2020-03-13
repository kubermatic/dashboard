import {Component, forwardRef, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {OperatingSystemSpec, Taint} from '../shared/entity/NodeEntity';
import {NodeProvider, OperatingSystem} from '../shared/model/NodeProviderConstants';
import {NodeData} from '../shared/model/NodeSpecChange';
import {ClusterType} from '../shared/utils/cluster-utils/cluster-utils';
import {BaseFormValidator} from '../shared/validators/base-form.validator';
import {ClusterService} from '../wizard-new/service/cluster';
import {NodeDataService} from './service/service';

enum Controls {
  Name = 'name',
  Count = 'count',
  DynamicConfig = 'dynamicConfig',
  OperatingSystem = 'operatingSystem',
  UpgradeOnBoot = 'upgradeOnBoot',
  DisableAutoUpdate = 'disableAutoUpdate',
  ProviderBasic = 'providerBasic',
  ProviderExtended = 'providerExtended',
}

@Component({
  selector: 'kubermatic-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => NodeDataComponent), multi: true},
  ]
})
export class NodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @Input() replicas = 3;
  @Input() provider: NodeProvider;
  @Input() clusterType: ClusterType;

  labels: object = {};
  taints: Taint[] = [];

  readonly NodeProvider = NodeProvider;
  readonly OperatingSystem = OperatingSystem;
  readonly Controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _nameGenerator: ClusterNameGenerator,
      private readonly _clusterService: ClusterService, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.pattern('[a-zA-Z0-9-]*')]),
      [Controls.Count]: this._builder.control(this.replicas, [Validators.required, Validators.min(0)]),
      [Controls.DynamicConfig]: this._builder.control(false),
      [Controls.OperatingSystem]: this._builder.control(this._getDefaultOS(), [Validators.required]),
      [Controls.UpgradeOnBoot]: this._builder.control(''),
      [Controls.DisableAutoUpdate]: this._builder.control(''),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    merge(
        this.form.get(Controls.Name).valueChanges,
        this.form.get(Controls.Count).valueChanges,
        this.form.get(Controls.DynamicConfig).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());

    merge(
        this.form.get(Controls.OperatingSystem).valueChanges,
        this.form.get(Controls.UpgradeOnBoot).valueChanges,
        this.form.get(Controls.DisableAutoUpdate).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.operatingSystem = this._getOperatingSystemSpec());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isProvider(provider: NodeProvider): boolean {
    return this.provider === provider;
  }

  isOpenshiftCluster(): boolean {
    return this._clusterService.cluster.type === ClusterType.OpenShift;
  }

  generateName(): void {
    this.form.get(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  isOsSelected(osName: OperatingSystem): boolean {
    return this.form.get(Controls.OperatingSystem).value === osName;
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  isBasicViewOnly(): boolean {
    // In the wizard we split extended and basic options.
    return this._nodeDataService.isInWizardMode();
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
          }
        };
      case OperatingSystem.ContainerLinux:
        return {containerLinux: {disableAutoUpdate: this.form.get(Controls.DisableAutoUpdate).value}};
      default:
        return {ubuntu: {distUpgradeOnBoot: false}};
    }
  }

  private _getDefaultOS(): OperatingSystem {
    return this.isOpenshiftCluster() ? OperatingSystem.CentOS : OperatingSystem.Ubuntu;
  }

  private _getNodeData(): NodeData {
    return {
      count: this.form.get(Controls.Count).value,
      name: this.form.get(Controls.Name).value,
      dynamicConfig: this.form.get(Controls.DynamicConfig).value,
    } as NodeData;
  }
}
