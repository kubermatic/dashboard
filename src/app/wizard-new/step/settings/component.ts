import {AfterViewInit, Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {StepBase} from '../base';
import {WizardStep} from '../step';

import {Presets} from './preset/component';
import {ProviderConfig} from './provider/config';

@Component({
  selector: 'kubermatic-wizard-settings-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SettingsStepComponent extends StepBase implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('dynamic', {read: ViewContainerRef, static: true}) containerRef: ViewContainerRef;

  provider: NodeProvider;
  readonly providers = NodeProvider;

  private readonly _defaultControls = [Presets.Controls.Preset, WizardStep.Controls.Config];
  private readonly _unsubscribe = new Subject<void>();

  constructor(private _resolver: ComponentFactoryResolver) {
    super();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this._wizard.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(provider => {
      this.provider = provider;

      this.containerRef.clear();
      this.reset(this._defaultControls);

      const providerCmp = ProviderConfig.GetProviderComponent(provider);
      const factory = this._resolver.resolveComponentFactory(providerCmp);
      const componentRef = this.containerRef.createComponent<StepBase>(factory);

      componentRef.instance.form = this.form;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
