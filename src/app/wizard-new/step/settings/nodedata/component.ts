import {AfterViewInit, Component, ComponentFactoryResolver, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';

import {ClusterNameGenerator} from '../../../../core/util/name-generator.service';
import {NodeDataProviderBase} from '../../../../node-data-new/provider/base';
import {NodeDataProviderConfig} from '../../../../node-data-new/provider/config';
import {Taint} from '../../../../shared/entity/NodeEntity';
import {NodeProvider, OperatingSystem} from '../../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../../shared/utils/cluster-utils/cluster-utils';
import {StepBase} from '../../base';

enum Controls {
  Name = 'name',
  Count = 'count',
  OperatingSystem = 'operatingSystem',
  UpgradeOnBoot = 'upgradeOnBoot',
  DisableAutoUpdate = 'disableAutoUpdate',
}

@Component({
  selector: 'kubermatic-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class NodeDataComponent extends StepBase implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dynamicNodeDataProvider', {read: ViewContainerRef, static: true}) providerContainerRef: ViewContainerRef;

  readonly NodeProvider = NodeProvider;
  readonly OperatingSystem = OperatingSystem;
  readonly Controls = Controls;

  @Input('replicas') replicas = 3;

  labels: object = {};
  taints: Taint[] = [];

  get provider(): NodeProvider {
    return this._wizard.provider;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _nameGenerator: ClusterNameGenerator,
      private readonly _resolver: ComponentFactoryResolver) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.pattern('[a-zA-Z0-9-]*')]),
      [Controls.Count]: this._builder.control(this.replicas, [Validators.required, Validators.min(0)]),
      [Controls.OperatingSystem]: this._builder.control(this._getDefaultOS(), [Validators.required]),
      [Controls.UpgradeOnBoot]: this._builder.control(''),
      [Controls.DisableAutoUpdate]: this._builder.control(''),
    });
  }

  ngAfterViewInit(): void {
    this.providerContainerRef.clear();

    const cmp = NodeDataProviderConfig.GetComponent(this._wizard.provider);
    const factory = this._resolver.resolveComponentFactory(cmp);
    const componentRef = this.providerContainerRef.createComponent<NodeDataProviderBase>(factory);

    componentRef.instance.form = this.form;
  }

  ngOnDestroy(): void {}

  isProvider(provider: NodeProvider): boolean {
    return this.provider === provider;
  }

  isOpenshiftCluster(): boolean {
    return this._wizard.clusterType === ClusterType.OpenShift;
  }

  generateName(): void {
    this.control(Controls.Name).setValue(this._nameGenerator.generateName());
  }

  isOsSelected(osName: OperatingSystem): boolean {
    return this.controlValue(Controls.OperatingSystem) === osName;
  }

  private _getDefaultOS(): OperatingSystem {
    return this.isOpenshiftCluster() ? OperatingSystem.CentOS : OperatingSystem.Ubuntu;
  }
}
