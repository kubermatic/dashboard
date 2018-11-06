import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { ClusterEntity, getClusterProvider } from '../../shared/entity/ClusterEntity';
import { getDatacenterProvider } from '../../shared/entity/DatacenterEntity';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';

@Component({
  selector: 'kubermatic-set-provider',
  templateUrl: 'set-provider.component.html',
  styleUrls: ['set-provider.component.scss'],
})
export class SetProviderComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public setProviderForm: FormGroup;
  public providers: string[] = [];
  private subscriptions: Subscription[] = [];

  constructor(private dcService: DatacenterService, private wizardService: WizardService) { }

  public ngOnInit(): void {
    this.setProviderForm = new FormGroup({
      provider: new FormControl(getClusterProvider(this.cluster), [Validators.required]),
    });

    this.subscriptions.push(this.setProviderForm.valueChanges.subscribe((data) => {
      this.wizardService.changeClusterProvider({
        provider: this.setProviderForm.controls.provider.value,
        valid: this.setProviderForm.valid,
      });
    }));

    this.subscriptions.push(this.dcService.getDataCenters().subscribe((datacenters) => {
      const providers: string[] = [];
      for (const datacenter of datacenters) {
        if (datacenter.seed) {
          continue;
        }
        const provider = getDatacenterProvider(datacenter);
        if (provider === '') {
          continue;
        }

        if (providers.indexOf(provider) === -1) {
          providers.push(provider);
        }
      }
      this.providers = providers;
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

}
