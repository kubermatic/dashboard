import {AfterViewInit, Component, ComponentFactoryResolver, forwardRef, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {AbstractControl, ControlValueAccessor, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator} from '@angular/forms';
import {merge, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {StepBase} from '../base';

import {NodeDataComponent} from './nodedata/component';
import {Presets} from './preset/component';
import {ProviderConfig} from './provider/config';

@Component({
  selector: 'kubermatic-wizard-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SettingsStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => SettingsStepComponent), multi: true}
  ]
})
export class SettingsStepComponent extends StepBase implements OnInit, OnDestroy, ControlValueAccessor, Validator,
                                                               AfterViewInit {
  @ViewChild('dynamicProvider', {read: ViewContainerRef, static: true}) providerContainerRef: ViewContainerRef;
  @ViewChild('dynamicNodeData', {read: ViewContainerRef, static: true}) ndContainerRef: ViewContainerRef;

  provider: NodeProvider;
  readonly providers = NodeProvider;

  private readonly _defaultControls = [Presets.Controls.Preset];
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _resolver: ComponentFactoryResolver) {
    super();
  }

  ngOnInit(): void {
    this.form = new FormGroup({});
  }

  ngAfterViewInit(): void {
    merge(this._wizard.providerChanges, this._wizard.datacenterChanges, this._wizard.clusterTypeChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          // Reset form to the default state before creating components.
          this.reset(this._defaultControls);

          this._initializeProvider();
          this._initializeNodeData();
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _initializeProvider(): void {
    this.provider = this._wizard.provider;
    this.providerContainerRef.clear();

    const providerCmp = ProviderConfig.GetComponent(this.provider);
    const factory = this._resolver.resolveComponentFactory(providerCmp);
    const componentRef = this.providerContainerRef.createComponent<StepBase>(factory);

    componentRef.instance.form = this.form;
  }

  private _initializeNodeData(): void {
    this.provider = this._wizard.provider;
    this.ndContainerRef.clear();

    const factory = this._resolver.resolveComponentFactory(NodeDataComponent);
    const componentRef = this.ndContainerRef.createComponent<StepBase>(factory);

    componentRef.instance.form = this.form;
  }

  registerOnChange(fn: any): void {
    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(fn);
  }

  registerOnTouched(_: any): void {}

  writeValue(obj: any): void {
    if (obj) {
      this.form.setValue(obj, {emitEvent: false});
    }
  }

  validate(control: AbstractControl): ValidationErrors|null {
    return this.form.valid ? null : {invalidForm: {valid: false, message: 'Settings step form fields are invalid'}};
  }
}
