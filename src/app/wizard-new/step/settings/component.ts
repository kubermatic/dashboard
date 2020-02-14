import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {ClusterType} from '../../../shared/utils/cluster-utils/cluster-utils';
import {ClusterService} from '../../service/cluster';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  ProviderBasic = 'providerBasic',
  ProviderExtended = 'providerExtended',
  NodeDataBasic = 'nodeDataBasic',
  NodeDataExtended = 'nodeDataExtended',
  Preset = 'preset',
}

@Component({
  selector: 'kubermatic-wizard-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SettingsStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => SettingsStepComponent), multi: true}
  ]
})
export class SettingsStepComponent extends StepBase implements OnInit, OnDestroy {
  readonly Provider = NodeProvider;
  readonly Control = Controls;

  extended = false;

  get provider(): NodeProvider {
    return this._wizard.provider;
  }

  get clusterType(): ClusterType {
    return this._clusterService.cluster.type;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _clusterService: ClusterService, wizard: WizardService) {
    super(wizard);
  }

  switch(): void {
    this.extended = !this.extended;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Preset]: this._builder.control(''),
      [Controls.ProviderBasic]: this._builder.control(''),
      [Controls.ProviderExtended]: this._builder.control(''),
      [Controls.NodeDataBasic]: this._builder.control(''),
      [Controls.NodeDataExtended]: this._builder.control(''),
    });

    // this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => console.log(this.form));
  }
}
