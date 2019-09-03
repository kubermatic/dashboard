import {AfterViewInit, Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {merge, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {StepBase} from '../base';
import {WizardStep} from '../step';

import {NodeDataComponent} from './nodedata/component';
import {Presets} from './preset/component';
import {ProviderConfig} from './provider/config';

@Component({
  selector: 'kubermatic-wizard-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SettingsStepComponent extends StepBase implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dynamicProvider', {read: ViewContainerRef, static: true}) providerContainerRef: ViewContainerRef;
  @ViewChild('dynamicNodeData', {read: ViewContainerRef, static: true}) ndContainerRef: ViewContainerRef;

  provider: NodeProvider;
  readonly providers = NodeProvider;

  private readonly _defaultControls = [Presets.Controls.Preset, WizardStep.Controls.Config];
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _resolver: ComponentFactoryResolver) {
    super();
  }

  ngOnInit(): void {}

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
}
