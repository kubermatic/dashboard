import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-azure-provider-settings',
  templateUrl: './azure-provider-settings.component.html',
})

export class AzureProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  azureProviderSettingsForm: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.azureProviderSettingsForm = new FormGroup({
      clientID: new FormControl(this.cluster.spec.cloud.azure.clientID, [Validators.required]),
      clientSecret: new FormControl(this.cluster.spec.cloud.azure.clientSecret, [Validators.required]),
      subscriptionID: new FormControl(this.cluster.spec.cloud.azure.subscriptionID, [Validators.required]),
      tenantID: new FormControl(this.cluster.spec.cloud.azure.tenantID, [Validators.required]),
    });

    this.azureProviderSettingsForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.clusterService.changeProviderSettingsPatch(this.getProviderSettingsPatch());
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getProviderSettingsPatch(): ProviderSettingsPatch {
    return {
      cloudSpecPatch: {
        azure: {
          clientID: this.azureProviderSettingsForm.controls.clientID.value,
          clientSecret: this.azureProviderSettingsForm.controls.clientSecret.value,
          subscriptionID: this.azureProviderSettingsForm.controls.subscriptionID.value,
          tenantID: this.azureProviderSettingsForm.controls.tenantID.value,
        },
      },
      isValid: this.azureProviderSettingsForm.valid,
    };
  }
}
