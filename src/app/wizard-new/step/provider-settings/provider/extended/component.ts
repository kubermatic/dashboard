import {Component, forwardRef, Input, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../service/cluster';

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

  constructor(private readonly _builder: FormBuilder, private readonly _clusterService: ClusterService) {
    super('Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.ProviderExtended]: this._builder.control(''),
    });

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => {
          this.form.removeControl(Controls.ProviderExtended);
          this.form.addControl(Controls.ProviderExtended, this._builder.control(''));
        });
  }
}
