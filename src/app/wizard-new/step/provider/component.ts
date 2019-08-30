import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
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
})
export class ProviderStepComponent extends StepBase implements OnInit, OnDestroy {
  providers: NodeProvider[] = [];

  private _unsubscribe: Subject<void> = new Subject<void>();

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

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
