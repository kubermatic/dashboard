import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClusterService } from '../../../../core/services';
import { ProviderSettingsPatch } from '../../../../core/services/cluster/cluster.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-vsphere-provider-settings',
  templateUrl: './vsphere-provider-settings.component.html',
})

export class VSphereProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public vsphereProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.vsphereProviderSettingsForm = new FormGroup({
      infraManagementUsername: new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.username, Validators.required),
      infraManagementPassword: new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.password, Validators.required),
      username: new FormControl(this.cluster.spec.cloud.vsphere.username),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
    });

    this.subscriptions.push(this.vsphereProviderSettingsForm.valueChanges.subscribe(() => {
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
        vsphere: {
          password: this.vsphereProviderSettingsForm.controls.password.value,
          username: this.vsphereProviderSettingsForm.controls.username.value,
          infraManagementUser: {
            username: this.vsphereProviderSettingsForm.controls.infraManagementUsername.value,
            password: this.vsphereProviderSettingsForm.controls.infraManagementPassword.value,
          },
        },
      },
      isValid: this.vsphereProviderSettingsForm.valid,
    };
  }
}
