import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-gcp-provider-settings',
  templateUrl: './gcp-provider-settings.component.html',
})

export class GCPProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  gcpProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.gcpProviderSettingsForm = new FormGroup({
      serviceAccount: new FormControl(this.cluster.spec.cloud.gcp.serviceAccount, [Validators.required]),
    });

    this.subscriptions.push(this.gcpProviderSettingsForm.valueChanges.subscribe(() => {
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
        gcp: {
          serviceAccount: this.gcpProviderSettingsForm.controls.serviceAccount.value,
        },
      },
      isValid: this.gcpProviderSettingsForm.valid,
    };
  }
}
