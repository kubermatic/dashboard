import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClusterService } from '../../../../core/services';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ProviderSettingsPatch } from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-digitalocean-provider-settings',
  templateUrl: './digitalocean-provider-settings.component.html',
})

export class DigitaloceanProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public digitaloceanProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.digitaloceanProviderSettingsForm = new FormGroup({
      token: new FormControl(this.cluster.spec.cloud.digitalocean.token, [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.subscriptions.push(this.digitaloceanProviderSettingsForm.valueChanges.subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        digitalocean: {
          token: this.digitaloceanProviderSettingsForm.controls.token.value,
        },
      },
      isValid: this.digitaloceanProviderSettingsForm.valid,
    };
  }
}
