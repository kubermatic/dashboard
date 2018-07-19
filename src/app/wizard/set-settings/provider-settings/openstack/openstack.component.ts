import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { WizardService, ApiService, Auth } from '../../../../core/services';
import { Subscription } from 'rxjs/Subscription';
import { OpenstackTenant } from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import { AppConfigService } from '../../../../app-config.service';
import { Config } from '../../../../shared/model/Config';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'kubermatic-openstack-cluster-settings',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss']
})
export class OpenstackClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  public tenants: OpenstackTenant[] = [];
  public loadingTenants = false;
  public openstackSettingsForm: FormGroup;
  public hideOptional = true;
  private subscriptions: Subscription[] = [];
  public config: Config;

  constructor(private wizardService: WizardService, private api: ApiService, private auth: Auth, private appConfigService: AppConfigService) { }

  ngOnInit() {
    this.config = this.appConfigService.getConfig();

    if (this.config.openstack && this.config.openstack.wizard_use_default_user && !this.cluster.spec.cloud.openstack.username) {
      this.cluster.spec.cloud.openstack.username = this.auth.getUsername();
    }

    this.openstackSettingsForm = new FormGroup({
      domain: new FormControl(this.cluster.spec.cloud.openstack.domain, [Validators.required]),
      tenant: new FormControl(this.cluster.spec.cloud.openstack.tenant, [Validators.required]),
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      floatingIpPool: new FormControl(this.cluster.spec.cloud.openstack.floatingIpPool, []),
      securityGroups: new FormControl(this.cluster.spec.cloud.openstack.securityGroups, []),
      network: new FormControl(this.cluster.spec.cloud.openstack.network, []),
    });

    this.loadTenants();

    this.subscriptions.push(this.openstackSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe(data => {
      this.loadTenants();
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

  public loadTenants() {
    if (
      this.openstackSettingsForm.controls.username.value === '' ||
      this.openstackSettingsForm.controls.password.value === '' ||
      this.openstackSettingsForm.controls.domain.value === '' ||
      this.tenants.length > 0) {
      return;
    }

    this.loadingTenants = true;
    this.subscriptions.push(this.api.getOpenStackTenants(this.openstackSettingsForm.controls.username.value, this.openstackSettingsForm.controls.password.value, this.openstackSettingsForm.controls.domain.value, this.cluster.spec.cloud.dc).subscribe(
      tenants => {
        const sortedTenants = tenants.sort((a, b) => {
          return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
        });
        this.tenants = sortedTenants;
        if (sortedTenants.length > 0 && this.openstackSettingsForm.controls.tenant.value !== '0') {
          this.openstackSettingsForm.controls.tenant.setValue(this.cluster.spec.cloud.openstack.tenant);
        }
        this.loadingTenants = false;
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
