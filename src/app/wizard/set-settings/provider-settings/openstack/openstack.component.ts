import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {debounceTime, first} from 'rxjs/operators';
import {AppConfigService} from '../../../../app-config.service';
import {ApiService, Auth, WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {OpenstackFloatingIpPool, OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant,} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {Config} from '../../../../shared/model/Config';

@Component({
  selector: 'kubermatic-openstack-cluster-settings',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss'],
})
export class OpenstackClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  clusterSpec: ClusterProviderSettingsForm;
  tenants: OpenstackTenant[] = [];
  subnetIds: OpenstackSubnet[] = [];
  network: OpenstackNetwork[] = [];
  floatingIpPool: OpenstackFloatingIpPool[] = [];
  securityGroup: OpenstackSecurityGroup[] = [];
  loadingSubnetIds = false;
  loadingOptionalSettings = false;
  loadingOptionalTenants = false;
  openstackSettingsForm: FormGroup;
  hideOptional = true;
  private subscriptions: Subscription[] = [];
  config: Config;

  constructor(
      private wizardService: WizardService, private api: ApiService, private auth: Auth,
      private appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.config = this.appConfigService.getConfig();

    if (this.config.openstack && this.config.openstack.wizard_use_default_user &&
        !this.cluster.spec.cloud.openstack.username) {
      this.cluster.spec.cloud.openstack.username = this.auth.getUsername();
    }

    this.openstackSettingsForm = new FormGroup({
      domain: new FormControl(this.cluster.spec.cloud.openstack.domain, [Validators.required]),
      tenant: new FormControl(this.cluster.spec.cloud.openstack.tenant, [Validators.required]),
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      floatingIpPool: new FormControl(this.cluster.spec.cloud.openstack.floatingIpPool),
      securityGroups: new FormControl(this.cluster.spec.cloud.openstack.securityGroups),
      network: new FormControl(this.cluster.spec.cloud.openstack.network),
      subnetId: new FormControl(this.cluster.spec.cloud.openstack.subnetID),
    });

    this.loadTenants();
    this.loadOptionalSettings();
    this.loadSubnetIds();

    this.wizardService.clusterProviderSettingsFormChanges$.subscribe((cluster) => {
      this.clusterSpec = cluster;
    });

    this.subscriptions.push(this.openstackSettingsForm.valueChanges.pipe(debounceTime(1000)).subscribe((event) => {
      if (event.domain !== '' && event.username !== '' && event.password !== '') {
        if (event.tenant === '' ||
            (!!this.clusterSpec.cloudSpec && event.tenant !== this.clusterSpec.cloudSpec.openstack.tenant)) {
          this.loadTenants();
          this.loadOptionalSettings();
        } else if (!!this.clusterSpec.cloudSpec && event.network !== this.clusterSpec.cloudSpec.openstack.network) {
          this.loadSubnetIds();
        }
      }

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
            subnetID: this.openstackSettingsForm.controls.subnetId.value,
          },
          dc: this.cluster.spec.cloud.dc,
        },
        valid: this.openstackSettingsForm.valid,
      });
    }));

    this.subscriptions.push(this.wizardService.clusterSettingsFormViewChanged$.subscribe((data) => {
      this.hideOptional = data.hideOptional;
    }));
  }

  loadTenants(): void {
    if (this.openstackSettingsForm.controls.username.value === '' ||
        this.openstackSettingsForm.controls.password.value === '' ||
        this.openstackSettingsForm.controls.domain.value === '') {
      return;
    }

    this.loadingOptionalTenants = true;
    this.api
        .getOpenStackTenantsForWizard(
            this.openstackSettingsForm.controls.username.value, this.openstackSettingsForm.controls.password.value,
            this.openstackSettingsForm.controls.domain.value, this.cluster.spec.cloud.dc)
        .pipe(first())
        .subscribe(
            (tenants) => {
              this.tenants = tenants.sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              if (this.tenants.length === 0) {
                this.openstackSettingsForm.controls.tenant.setValue('');
              }

              this.loadingOptionalTenants = false;
            },
            () => {
              this.tenants = [];
              this.loadingOptionalTenants = false;
            });
  }

  loadOptionalSettings(): void {
    if (this.openstackSettingsForm.controls.username.value === '' ||
        this.openstackSettingsForm.controls.password.value === '' ||
        this.openstackSettingsForm.controls.domain.value === '' ||
        this.openstackSettingsForm.controls.tenant.value === '') {
      return;
    }

    this.loadingOptionalSettings = true;
    this.api
        .getOpenStackNetworkForWizard(
            this.openstackSettingsForm.controls.username.value, this.openstackSettingsForm.controls.password.value,
            this.openstackSettingsForm.controls.tenant.value, this.openstackSettingsForm.controls.domain.value,
            this.cluster.spec.cloud.dc)
        .pipe(first())
        .subscribe((networks: OpenstackNetwork[]) => {
          this.network = networks.filter((network) => network.external !== true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });
          this.floatingIpPool = networks.filter((network) => network.external === true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.network.length === 0) {
            this.openstackSettingsForm.controls.network.setValue('');
          }

          if (this.floatingIpPool.length === 0) {
            this.openstackSettingsForm.controls.floatingIpPool.setValue('');
          }
        });

    this.api
        .getOpenStackSecurityGroupsForWizard(
            this.openstackSettingsForm.controls.username.value, this.openstackSettingsForm.controls.password.value,
            this.openstackSettingsForm.controls.tenant.value, this.openstackSettingsForm.controls.domain.value,
            this.cluster.spec.cloud.dc)
        .pipe(first())
        .subscribe((securityGroups) => {
          this.securityGroup = securityGroups.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.securityGroup.length === 0) {
            this.openstackSettingsForm.controls.securityGroups.setValue('');
          }

          this.loadingOptionalSettings = false;
        });
  }

  loadSubnetIds(): void {
    if (this.openstackSettingsForm.controls.network.value === '') {
      return this.openstackSettingsForm.controls.subnetId.setValue('');
    }

    this.loadingSubnetIds = true;

    this.api
        .getOpenStackSubnetIdsForWizard(
            this.openstackSettingsForm.controls.username.value, this.openstackSettingsForm.controls.password.value,
            this.openstackSettingsForm.controls.tenant.value, this.openstackSettingsForm.controls.domain.value,
            this.cluster.spec.cloud.dc, this.openstackSettingsForm.controls.network.value)
        .pipe(first())
        .subscribe((subnets) => {
          this.subnetIds = subnets.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.subnetIds.length === 0) {
            this.openstackSettingsForm.controls.subnetId.setValue('');
          }

          this.loadingSubnetIds = false;
        });
  }

  isFloatingIPEnforced(): boolean {
    return this.wizardService.getSelectedDatacenter().spec.openstack.enforce_floating_ip;
  }

  getTenantsFormState(): string {
    if (!this.loadingOptionalTenants &&
        (this.openstackSettingsForm.controls.username.value === '' ||
         this.openstackSettingsForm.controls.password.value === '' ||
         this.openstackSettingsForm.controls.domain.value === '')) {
      return 'Tenant/Project: Please enter your credentials first!';
    } else if (this.loadingOptionalTenants) {
      return 'Loading Tenants/Projects...';
    } else if (!this.loadingOptionalTenants && this.tenants.length === 0) {
      return 'No Tenants/Projects available';
    } else {
      return 'Tenant/Project*:';
    }
  }

  getOptionalSettingsFormState(field: string): string {
    if (!this.loadingOptionalSettings &&
        (this.openstackSettingsForm.controls.username.value === '' ||
         this.openstackSettingsForm.controls.password.value === '' ||
         this.openstackSettingsForm.controls.domain.value === '' ||
         this.openstackSettingsForm.controls.tenant.value === '')) {
      return field + ': Please enter Tenant/Project first!';
    } else if (this.loadingOptionalSettings) {
      return 'Loading ' + field + 's...';
    } else {
      switch (field) {
        case 'Floating IP Pool':
          return this.floatingIpPool.length === 0 ? 'No Floating IP Pools available' : field + ':';
        case 'Security Group':
          return this.securityGroup.length === 0 ? 'No Security Groups available' : field + ':';
        case 'Network':
          return this.network.length === 0 ? 'No Networks available' : field + ':';
        default:
          return '';
      }
    }
  }

  getSubnetIDFormState(): string {
    if (!this.loadingSubnetIds &&
        (this.openstackSettingsForm.controls.username.value === '' ||
         this.openstackSettingsForm.controls.password.value === '' ||
         this.openstackSettingsForm.controls.domain.value === '' ||
         this.openstackSettingsForm.controls.tenant.value === '' ||
         this.openstackSettingsForm.controls.network.value === '')) {
      return 'Subnet ID: Please enter Network first!';
    } else if (this.loadingSubnetIds) {
      return 'Loading Subnet IDs...';
    } else if (this.openstackSettingsForm.controls.network.value !== '' && this.subnetIds.length === 0) {
      return 'No Subnet IDs available';
    } else {
      return 'Subnet ID:';
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
