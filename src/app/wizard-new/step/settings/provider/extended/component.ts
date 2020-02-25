import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../shared/validators/base-form.validator';

enum Controls {
  ProviderExtended = 'providerExtended',
}

@Component({
  selector: 'kubermatic-wizard-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => ProviderExtendedComponent), multi: true}
  ]
})
export class ProviderExtendedComponent extends BaseFormValidator implements OnInit {
  @Input() provider: NodeProvider;
  @Input() visible = false;

  readonly Providers = NodeProvider;
  readonly Controls = Controls;

  form: FormGroup;

  constructor(private readonly _builder: FormBuilder) {
    super('Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderExtended]: this._builder.control(''),
    });
  }
}
