import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ClusterService} from '../../../../core/services';
import {ProviderSettingsPatch} from '../../../../core/services/cluster/cluster.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-openstack-provider-settings',
  templateUrl: './openstack-provider-settings.component.html',
})

export class OpenstackProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  openstackProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.openstackProviderSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
    });

    this.subscriptions.push(this.openstackProviderSettingsForm.valueChanges.subscribe(() => {
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
        openstack: {
          password: this.openstackProviderSettingsForm.controls.password.value,
          username: this.openstackProviderSettingsForm.controls.username.value,
        },
      },
      isValid: this.openstackProviderSettingsForm.valid,
    };
  }
}
