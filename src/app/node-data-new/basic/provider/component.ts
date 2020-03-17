import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../wizard-new/service/cluster';

enum Controls {
  ProviderBasic = 'providerBasic',
}

@Component({
  selector: 'kubermatic-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => BasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => BasicNodeDataComponent), multi: true}
  ]
})
export class BasicNodeDataComponent extends BaseFormValidator implements OnInit {
  @Input() provider: string;

  readonly Provider = NodeProvider;
  readonly Control = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _clusterService: ClusterService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderBasic]: this._builder.control(''),
    });

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          this.form.removeControl(Controls.ProviderBasic);
          this.form.addControl(Controls.ProviderBasic, this._builder.control(''));
        });
  }
}
