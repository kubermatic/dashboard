import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {StepBase} from '../base';

@Component({
  selector: 'kubermatic-wizard-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SettingsStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => SettingsStepComponent), multi: true}
  ]
})
export class SettingsStepComponent extends StepBase implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  provider: NodeProvider;
  readonly providers = NodeProvider;

  // private readonly _defaultControls = [Presets.Controls.Preset];

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.form = new FormGroup({});

    merge(this._wizard.providerChanges, this._wizard.datacenterChanges, this._wizard.clusterTypeChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => {
                // Reset form to the default state before creating components.
                // this.reset(this._defaultControls);
            });
  }

  // private _initializeProvider(): void {
  //   this.provider = this._wizard.provider;
  //   this.providerContainerRef.clear();
  //
  //   const providerCmp = ProviderConfig.GetComponent(this.provider);
  //   const factory = this._resolver.resolveComponentFactory(providerCmp);
  //   const componentRef = this.providerContainerRef.createComponent<StepBase>(factory);
  //
  //   componentRef.instance.form = this.form;
  // }
  //
  // private _initializeNodeData(): void {
  //   this.provider = this._wizard.provider;
  //   this.ndContainerRef.clear();
  //
  //   const factory = this._resolver.resolveComponentFactory(NodeDataComponent);
  //   this.ndContainerRef.createComponent(factory);
  //
  //   componentRef.instance.form = this.form;
  // }
}
