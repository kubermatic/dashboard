import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService } from '../../../../core/services';
import { ClusterService } from '../../../../core/services/cluster/cluster.service';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ClusterProviderSettingsData } from '../../../../shared/model/ClusterSpecChange';

@Component({
  selector: 'kubermatic-openstack-provider-settings',
  templateUrl: './openstack-provider-settings.component.html',
  styleUrls: ['./openstack-provider-settings.component.scss']
})

export class OpenstackProviderSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public openstackProviderSettingsForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.openstackProviderSettingsForm = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
    });

    this.subscriptions.push(this.openstackProviderSettingsForm.valueChanges.subscribe(data => {
      if (this.openstackProviderSettingsForm.valid) {
        this.clusterService.changeProviderSettingsData(this.getProviderSettingsData());
      }
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProviderSettingsData(): ClusterProviderSettingsData {
    return {
      openstack: {
        password: this.openstackProviderSettingsForm.controls.password.value,
        username: this.openstackProviderSettingsForm.controls.username.value,
        tenant: this.cluster.spec.cloud.openstack.tenant,
        domain: this.cluster.spec.cloud.openstack.domain,
        network: this.cluster.spec.cloud.openstack.network,
        securityGroups: this.cluster.spec.cloud.openstack.securityGroups,
        floatingIpPool: this.cluster.spec.cloud.openstack.floatingIpPool,
        subnetID: this.cluster.spec.cloud.openstack.subnetID
      },
      valid: true
    };
  }
}
