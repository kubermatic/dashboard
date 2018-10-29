import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClusterService } from '../../../../core/services';
import { ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import { ProviderSettingsPatch } from '../../../../core/services/cluster/cluster.service';

@Component({
  selector: 'kubermatic-hetzner-provider-settings',
  templateUrl: './hetzner-provider-settings.component.html',
})

export class HetznerProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public hetznerProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.hetznerProviderSettingsForm = new FormGroup({
      token: new FormControl(this.cluster.spec.cloud.hetzner.token, [Validators.required, Validators.minLength(64), Validators.maxLength(64)]),
    });

    this.subscriptions.push(this.hetznerProviderSettingsForm.valueChanges.subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        hetzner: {
          token: this.hetznerProviderSettingsForm.controls.token.value,
        },
      },
      isValid: this.hetznerProviderSettingsForm.valid,
    };
  }
}
