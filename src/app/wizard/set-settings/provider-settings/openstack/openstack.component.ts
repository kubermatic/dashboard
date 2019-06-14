import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, first, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../../app-config.service';
import {Auth, WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {OpenstackFloatingIpPool, OpenstackNetwork, OpenstackOptionalFields, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {Config} from '../../../../shared/model/Config';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

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
  networks: OpenstackNetwork[] = [];
  floatingIpPools: OpenstackFloatingIpPool[] = [];
  securityGroups: OpenstackSecurityGroup[] = [];
  loadingSubnetIds = false;
  loadingOptionalSettings = false;
  loadingOptionalTenants = false;
  openstackSettingsForm: FormGroup;
  hideOptional = true;
  config: Config;

  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _wizard: WizardService, private readonly _auth: Auth,
      private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.config = this._appConfigService.getConfig();

    if (this.config.openstack && this.config.openstack.wizard_use_default_user &&
        !this.cluster.spec.cloud.openstack.username) {
      this.cluster.spec.cloud.openstack.username = this._auth.getUsername();
    }

    this.openstackSettingsForm = new FormGroup({
      domain: new FormControl(this.cluster.spec.cloud.openstack.domain, [Validators.required]),
      tenant: new FormControl(this.cluster.spec.cloud.openstack.tenant, [Validators.required]),
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      floatingIpPool: new FormControl(this.cluster.spec.cloud.openstack.floatingIpPool),
      securityGroup: new FormControl(this.cluster.spec.cloud.openstack.securityGroups),
      network: new FormControl(this.cluster.spec.cloud.openstack.network),
      subnetId: new FormControl(this.cluster.spec.cloud.openstack.subnetID),
    });

    this.loadTenants();
    this.loadOptionalSettings();
    this.loadSubnetIds();
    this.checkState();

    this._wizard.clusterProviderSettingsFormChanges$.subscribe((cluster) => {
      this.clusterSpec = cluster;
    });

    this.openstackSettingsForm.valueChanges.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((changes) => {
          if (changes.domain !== '' && changes.username !== '' && changes.password !== '') {
            if (!!this.clusterSpec &&
                (this.tenants.length === 0 ||
                 (changes.domain !== this.clusterSpec.cloudSpec.openstack.domain ||
                  changes.username !== this.clusterSpec.cloudSpec.openstack.username ||
                  changes.password !== this.clusterSpec.cloudSpec.openstack.password))) {
              this.loadTenants();
            } else if (
                !!this.clusterSpec &&
                ((changes.tenant !== '' && changes.tenant !== this.clusterSpec.cloudSpec.openstack.tenant) ||
                 (changes.tenant !== '' && this.networks.length === 0 && this.floatingIpPools.length === 0 &&
                  this.securityGroups.length === 0))) {
              this.loadOptionalSettings();
            } else if (this.tenants.length === 0 || changes.tenant === '') {
              this.resetOptionalFields(false);
            } else if (
                !!this.clusterSpec &&
                ((changes.network !== '' && changes.network !== this.clusterSpec.cloudSpec.openstack.network) ||
                 (changes.network !== '' && this.subnetIds.length === 0))) {
              this.loadSubnetIds();
            } else if (this.networks.length === 0) {
              this.openstackSettingsForm.controls.subnetId.setValue('');
              this.subnetIds = [];
            }
            this.checkState();
          } else {
            this.resetOptionalFields(true);
          }

          this._wizard.changeClusterProviderSettings({
            cloudSpec: {
              openstack: {
                tenant: this.openstackSettingsForm.controls.tenant.value,
                domain: this.openstackSettingsForm.controls.domain.value,
                username: this.openstackSettingsForm.controls.username.value,
                password: this.openstackSettingsForm.controls.password.value,
                floatingIpPool: this.openstackSettingsForm.controls.floatingIpPool.value,
                securityGroups: this.openstackSettingsForm.controls.securityGroup.value,
                network: this.openstackSettingsForm.controls.network.value,
                subnetID: this.openstackSettingsForm.controls.subnetId.value,
              },
              dc: this.cluster.spec.cloud.dc,
            },
            valid: this.openstackSettingsForm.valid,
          });
        });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });
  }

  resetOptionalFields(withTenant: boolean): void {
    if (withTenant) {
      this.openstackSettingsForm.controls.tenant.setValue('');
      this.tenants = [];
    }
    this.openstackSettingsForm.controls.network.setValue('');
    this.openstackSettingsForm.controls.floatingIpPool.setValue('');
    this.openstackSettingsForm.controls.securityGroup.setValue('');
    this.openstackSettingsForm.controls.subnetId.setValue('');
    this.networks = [];
    this.floatingIpPools = [];
    this.securityGroups = [];
    this.subnetIds = [];
    this.checkState();
  }

  loadTenants(): void {
    if (this.openstackSettingsForm.controls.username.value === '' ||
        this.openstackSettingsForm.controls.password.value === '' ||
        this.openstackSettingsForm.controls.domain.value === '') {
      return;
    }

    this.loadingOptionalTenants = true;
    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.openstackSettingsForm.controls.username.value)
        .password(this.openstackSettingsForm.controls.password.value)
        .domain(this.openstackSettingsForm.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .tenants()
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
              this.checkState();
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
    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.openstackSettingsForm.controls.username.value)
        .password(this.openstackSettingsForm.controls.password.value)
        .tenant(this.openstackSettingsForm.controls.tenant.value)
        .domain(this.openstackSettingsForm.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .networks()
        .pipe(first())
        .subscribe((networks: OpenstackNetwork[]) => {
          this.networks = networks.filter((network) => network.external !== true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });
          this.floatingIpPools = networks.filter((network) => network.external === true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.networks.length === 0) {
            this.openstackSettingsForm.controls.network.setValue('');
          }

          if (this.floatingIpPools.length === 0) {
            this.openstackSettingsForm.controls.floatingIpPool.setValue('');
          }
        });

    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.openstackSettingsForm.controls.username.value)
        .password(this.openstackSettingsForm.controls.password.value)
        .tenant(this.openstackSettingsForm.controls.tenant.value)
        .domain(this.openstackSettingsForm.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .securityGroups()
        .pipe(first())
        .subscribe((securityGroups) => {
          this.securityGroups = securityGroups.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.securityGroups.length === 0) {
            this.openstackSettingsForm.controls.securityGroup.setValue('');
          }

          this.loadingOptionalSettings = false;
        });
  }

  loadSubnetIds(): void {
    if (this.openstackSettingsForm.controls.network.value === '') {
      return this.openstackSettingsForm.controls.subnetId.setValue('');
    }

    this.loadingSubnetIds = true;

    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.openstackSettingsForm.controls.username.value)
        .password(this.openstackSettingsForm.controls.password.value)
        .tenant(this.openstackSettingsForm.controls.tenant.value)
        .domain(this.openstackSettingsForm.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .subnets(this.openstackSettingsForm.controls.network.value)
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
    return this._wizard.getSelectedDatacenter().spec.openstack.enforce_floating_ip;
  }

  isMissingCredentialsForTenant() {
    return (
        this.openstackSettingsForm.controls.username.value === '' ||
        this.openstackSettingsForm.controls.password.value === '' ||
        this.openstackSettingsForm.controls.domain.value === '');
  }

  showHint(field: string): boolean {
    switch (field) {
      case 'tenant':
        return !this.loadingOptionalTenants && this.isMissingCredentialsForTenant();
      case 'subnetId':
        return !this.loadingSubnetIds &&
            (this.isMissingCredentialsForTenant() || this.openstackSettingsForm.controls.tenant.value === '' ||
             this.openstackSettingsForm.controls.network.value === '');
      case 'optionalSettings':
        return !this.loadingOptionalSettings &&
            (this.isMissingCredentialsForTenant() || this.openstackSettingsForm.controls.tenant.value === '');
      default:
        return false;
    }
  }

  getTenantsFormState(): string {
    if (!this.loadingOptionalTenants && this.isMissingCredentialsForTenant()) {
      return 'Project*';
    } else if (this.loadingOptionalTenants) {
      return 'Loading Projects...';
    } else if (!this.loadingOptionalTenants && this.tenants.length === 0) {
      return 'No Projects available';
    } else {
      return 'Project*';
    }
  }

  getOptionalSettingsFormState(field: string): string {
    if (!this.loadingOptionalSettings &&
        (this.isMissingCredentialsForTenant() || this.openstackSettingsForm.controls.tenant.value === '')) {
      return field;
    } else if (this.loadingOptionalSettings) {
      return 'Loading ' + field + 's...';
    } else {
      switch (field) {
        case 'Floating IP Pool':
          return this.floatingIpPools.length === 0 ? 'No Floating IP Pools available' : field;
        case 'Security Group':
          return this.securityGroups.length === 0 ? 'No Security Groups available' : field;
        case 'Network':
          return this.networks.length === 0 ? 'No Networks available' : field;
        default:
          return '';
      }
    }
  }

  getSubnetIDFormState(): string {
    if (!this.loadingSubnetIds &&
        (this.isMissingCredentialsForTenant() || this.openstackSettingsForm.controls.tenant.value === '' ||
         this.openstackSettingsForm.controls.network.value === '')) {
      return 'Subnet ID';
    } else if (this.loadingSubnetIds) {
      return 'Loading Subnet IDs...';
    } else if (this.openstackSettingsForm.controls.network.value !== '' && this.subnetIds.length === 0) {
      return 'No Subnet IDs available';
    } else {
      return 'Subnet ID';
    }
  }

  checkState(): void {
    const fields: OpenstackOptionalFields[] = [
      {'length': this.tenants.length, 'name': 'tenant'},
      {'length': this.floatingIpPools.length, 'name': 'floatingIpPool'},
      {'length': this.securityGroups.length, 'name': 'securityGroup'},
      {'length': this.networks.length, 'name': 'network'}, {'length': this.subnetIds.length, 'name': 'subnetId'}
    ];

    for (const i in fields) {
      if (fields[i].length === 0) {
        this.openstackSettingsForm.get(fields[i].name).disable();
      } else {
        this.openstackSettingsForm.get(fields[i].name).enable();
      }
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
