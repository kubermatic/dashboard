import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';
import {ClusterService} from '../../service/cluster';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  NodeDataBasic = 'nodeDataBasic',
  NodeDataExtended = 'nodeDataExtended',
}

@Component({
  selector: 'kubermatic-wizard-node-settings-step',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NodeSettingsStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => NodeSettingsStepComponent), multi: true}
  ]
})
export class NodeSettingsStepComponent extends StepBase implements OnInit, OnDestroy {
  readonly Provider = NodeProvider;
  readonly Control = Controls;

  provider: NodeProvider;

  get clusterType(): ClusterType {
    return this._clusterService.cluster.type;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _clusterService: ClusterService, wizard: WizardService) {
    super(wizard, 'Node settings');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.NodeDataBasic]: this._builder.control(''),
      [Controls.NodeDataExtended]: this._builder.control(''),
    });

    this.provider = this._wizard.provider;
    this._wizard.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => this.provider = provider);
  }
}
