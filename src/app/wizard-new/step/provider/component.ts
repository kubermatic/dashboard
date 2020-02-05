import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService} from '../../../core/services';
import {getDatacenterProvider} from '../../../shared/entity/DatacenterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {StepBase} from '../base';

enum Controls {
  Provider = 'provider'
}

@Component({
  selector: 'kubermatic-wizard-provider-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ProviderStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => ProviderStepComponent), multi: true}
  ]
})
export class ProviderStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  providers: NodeProvider[] = [];

  constructor(private readonly _builder: FormBuilder, private readonly _dcService: DatacenterService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
    });

    this._dcService.getDataCenters().pipe(takeUntil(this._unsubscribe)).subscribe((datacenters) => {
      const providers: NodeProvider[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }

        const provider = getDatacenterProvider(datacenter);
        if (!providers.includes(provider)) {
          providers.push(provider);
        }
      }
      this.providers = providers;
    });

    this.control(Controls.Provider)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe((provider: NodeProvider) => this._wizard.provider = provider);
  }
}
