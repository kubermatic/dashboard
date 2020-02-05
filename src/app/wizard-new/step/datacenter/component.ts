import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator, Validators} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService} from '../../../core/services';
import {DataCenterEntity, getDatacenterProvider} from '../../../shared/entity/DatacenterEntity';
import {StepBase} from '../base';

enum Controls {
  Datacenter = 'datacenter'
}

@Component({
  selector: 'kubermatic-wizard-datacenter-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatacenterStepComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => DatacenterStepComponent), multi: true}
  ]
})
export class DatacenterStepComponent extends StepBase implements OnInit, ControlValueAccessor, Validator, OnDestroy {
  datacenters: DataCenterEntity[] = [];

  constructor(private readonly _builder: FormBuilder, private readonly _dcService: DatacenterService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Datacenter]: new FormControl('', [Validators.required]),
    });

    this._dcService.getDataCenters().pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      const providerDatacenters: DataCenterEntity[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }

        const provider = getDatacenterProvider(datacenter);
        const clusterProvider = this._wizard.provider;
        if (provider === clusterProvider) {
          providerDatacenters.push(datacenter);
        }
      }

      this.datacenters = providerDatacenters;
    });

    this.control(Controls.Datacenter)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(datacenter => this._wizard.datacenter = datacenter);

    this._wizard.providerChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.control(Controls.Datacenter).setValue('');
    });
  }

  getLocation(datacenter: DataCenterEntity): string {
    let location = datacenter.spec.location;
    let idx = location.indexOf('(');

    location = location.substring(0, idx > -1 ? idx : undefined);

    idx = location.includes(' - ') ? location.indexOf('-') : -1;
    location = location.substring(0, idx > -1 ? idx : undefined);

    location = location.replace('Azure', '');
    return location.trim();
  }

  getZone(datacenter: DataCenterEntity): string {
    let location = datacenter.spec.location;
    let idx = location.indexOf('(');

    location = idx > -1 ? location.substring(idx + 1).replace(')', '') : location;

    idx = location.includes(' - ') ? location.indexOf('-') : -1;
    location = idx > -1 ? location.substring(idx + 1) : location;

    return location === datacenter.spec.location ? '' : location.trim();
  }
}
