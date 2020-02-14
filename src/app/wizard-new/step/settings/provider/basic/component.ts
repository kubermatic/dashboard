import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../shared/validators/base-form.validator';

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
  @Input() provider: NodeProvider;

  readonly Providers = NodeProvider;
  readonly Controls = Controls;

  form: FormGroup;

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderBasic]: this._builder.control(''),
    });
  }
}
