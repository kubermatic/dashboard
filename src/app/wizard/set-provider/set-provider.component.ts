import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {DatacenterService, WizardService} from '../../core/services';
import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {getDatacenterProvider} from '../../shared/entity/DatacenterEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss'],
})
export class SetProviderComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  setProviderForm: FormGroup;
  providers: NodeProvider[] = [];
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private dcService: DatacenterService, private wizardService: WizardService) {}

  ngOnInit(): void {
    this.setProviderForm = new FormGroup({
      provider: new FormControl('', [Validators.required]),
    });

    this.setProviderForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.changeClusterProvider();
    });

    this.dcService.getDataCenters().pipe(takeUntil(this._unsubscribe)).subscribe((datacenters) => {
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
  }

  changeClusterProvider(): void {
    this.wizardService.changeClusterProvider({
      provider: this.setProviderForm.controls.provider.value,
      valid: this.setProviderForm.valid,
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
