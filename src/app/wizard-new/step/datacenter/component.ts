import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';

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
})
export class DatacenterStepComponent extends StepBase implements OnInit, OnDestroy {
  datacenters: DataCenterEntity[] = [];

  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(private readonly _builder: FormBuilder, private readonly _dcService: DatacenterService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Datacenter]: new FormControl('', [Validators.required]),
    });

    this._wizard.providerChanges$.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(_ => this._dcService.getDataCenters()))
        .subscribe(datacenters => {
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

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
