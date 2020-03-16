import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../shared/validators/base-form.validator';
import {WizardService} from '../../../../service/wizard';

enum Controls {
  ProviderBasic = 'providerBasic',
}

@Component({
  selector: 'kubermatic-wizard-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => ProviderBasicComponent), multi: true}
  ]
})
export class ProviderBasicComponent extends BaseFormValidator implements OnInit {
  readonly Providers = NodeProvider;
  readonly Controls = Controls;

  form: FormGroup;

  get provider(): NodeProvider {
    return this._wizard.provider;
  }

  constructor(private readonly _builder: FormBuilder, private readonly _wizard: WizardService) {
    super('Provider Basic');
  }

  ngOnInit(): void {
    this._init();

    merge(this._wizard.providerChanges, this._wizard.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          this.form.reset();
        });
  }

  private _init(): void {
    this.form = this._builder.group({
      [Controls.ProviderBasic]: this._builder.control(''),
    });
  }
}
