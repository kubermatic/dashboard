import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {ControlValueAccessor, FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validator, Validators} from '@angular/forms';
import {filter, map, switchMap, takeUntil} from 'rxjs/operators';

import {DatacenterService} from '../../../core/services';
import {DataCenterEntity, getDatacenterProvider} from '../../../shared/entity/DatacenterEntity';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {WizardService} from '../../service/wizard';
import {StepBase} from '../base';

enum Controls {
  Provider = 'provider',
  Datacenter = 'datacenter',
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
  datacenters: DataCenterEntity[] = [];

  readonly controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _dcService: DatacenterService, wizard: WizardService) {
    super(wizard);
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Provider]: new FormControl('', [Validators.required]),
      [Controls.Datacenter]: new FormControl('', [Validators.required]),
    });

    // TODO(floreks): Remove once all providers are implemented
    const dcWhitelist = [NodeProvider.AWS, NodeProvider.BRINGYOUROWN, NodeProvider.DIGITALOCEAN, NodeProvider.VSPHERE];
    this._dcService.getDataCenters()
        .pipe(map(dcs => dcs.filter(dc => dcWhitelist.includes(dc.spec.provider as NodeProvider))))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((datacenters) => {
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

    this._wizard.providerChanges.pipe(switchMap(_ => this._dcService.getDataCenters()))
        .pipe(takeUntil(this._unsubscribe))
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

    this.control(Controls.Datacenter)
        .valueChanges
        // Allow only non-empty values
        .pipe(filter(value => value))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(datacenter => this._wizard.datacenter = datacenter);
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
