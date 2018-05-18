import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-openstack-cluster-settings',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public openstackSettingsForm: FormGroup;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];

  constructor(private wizardService: WizardService) { }

  ngOnInit() {
    this.openstackSettingsForm = new FormGroup({
      domain: new FormControl(this.cluster.spec.cloud.openstack.domain, [Validators.required]),
      tenant: new FormControl(this.cluster.spec.cloud.openstack.tenant, [Validators.required]),
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      floatingIpPool: new FormControl(this.cluster.spec.cloud.openstack.floatingIpPool, []),
      securityGroups: new FormControl(this.cluster.spec.cloud.openstack.securityGroups, []),
      network: new FormControl(this.cluster.spec.cloud.openstack.network, []),
    });

    this.subscriptions.push(this.openstackSettingsForm.valueChanges.subscribe(data => {
      this.wizardService.changeClusterProviderSettings({
        cloudSpec: {
          openstack: {
            tenant: this.openstackSettingsForm.controls.tenant.value,
            domain: this.openstackSettingsForm.controls.domain.value,
            username: this.openstackSettingsForm.controls.username.value,
            password: this.openstackSettingsForm.controls.password.value,
            floatingIpPool: this.openstackSettingsForm.controls.floatingIpPool.value,
            securityGroups: this.openstackSettingsForm.controls.securityGroups.value,
            network: this.openstackSettingsForm.controls.network.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.openstackSettingsForm.valid,
      });
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe(data => {
      this.hideOptional = data.hideOptional;
    }));
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
