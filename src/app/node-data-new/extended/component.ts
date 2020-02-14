import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../shared/validators/base-form.validator';

enum Controls {
  Provider = 'provider',
}

@Component({
  selector: 'kubermatic-extended-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ExtendedNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => ExtendedNodeDataComponent), multi: true}
  ]
})
export class ExtendedNodeDataComponent extends BaseFormValidator implements OnInit {
  @Input() provider: string;
  @Input() visible = false;

  form: FormGroup;

  readonly Provider = NodeProvider;
  readonly Control = Controls;

  constructor(private readonly _builder: FormBuilder) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: this._builder.control(''),
    });
  }
}
