import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {merge, Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../../app-config.service';
import {Auth, WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {OpenstackFloatingIpPool, OpenstackNetwork, OpenstackOptionalFields, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {Config} from '../../../../shared/model/Config';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-openstack-cluster-settings',
  templateUrl: './openstack.component.html',
  styleUrls: ['./openstack.component.scss'],
})
export class OpenstackClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  form: FormGroup;
  subnetIds: OpenstackSubnet[] = [];
  tenants: OpenstackTenant[] = [];
  networks: OpenstackNetwork[] = [];
  floatingIpPools: OpenstackFloatingIpPool[] = [];
  securityGroups: OpenstackSecurityGroup[] = [];
  hideOptional = true;

  private _loadingSubnetIds = false;
  private _loadingOptionalSettings = false;
  private _loadingOptionalTenants = false;
  private _config: Config;
  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _wizard: WizardService, private readonly _auth: Auth,
      private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this._config = this._appConfigService.getConfig();

    if (this._config.openstack && this._config.openstack.wizard_use_default_user &&
        !this.cluster.spec.cloud.openstack.username) {
      this.cluster.spec.cloud.openstack.username = this._auth.getUsername();
    }

    this.form = new FormGroup({
      domain: new FormControl(this.cluster.spec.cloud.openstack.domain, [Validators.required]),
      tenant: new FormControl(this.cluster.spec.cloud.openstack.tenant, [Validators.required]),
      tenantID: new FormControl(this.cluster.spec.cloud.openstack.tenantID, [Validators.required]),
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      floatingIpPool: new FormControl(this.cluster.spec.cloud.openstack.floatingIpPool),
      securityGroup: new FormControl(this.cluster.spec.cloud.openstack.securityGroups),
      network: new FormControl(this.cluster.spec.cloud.openstack.network),
      subnetId: new FormControl(this.cluster.spec.cloud.openstack.subnetID),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.domain,
        this.form.controls.tenant,
        this.form.controls.tenantID,
        this.form.controls.username,
        this.form.controls.password,
    );

    if (this.isFloatingIPEnforced()) {
      this._formHelper.registerFormControl(this.form.controls.floatingIpPool);
    }

    this._loadTenants();
    this._loadOptionalSettings();
    this._loadSubnetIds();
    this._checkState();

    merge(
        this.form.controls.domain.valueChanges, this.form.controls.username.valueChanges,
        this.form.controls.password.valueChanges)
        .pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          if (!this._hasTenantCredentials()) {
            this.form.controls.tenantID.disable();
            this._resetOptionalFields(true);
            return;
          }

          this.form.controls.tenantID.enable();
          this._loadTenants();
        });

    this.form.controls.tenantID.valueChanges.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(value => {
          value ? this._disableControl(this.form.controls.tenant) : this._enableControl(this.form.controls.tenant);

          if (this._isTenantIDSelected()) {
            this._resetOptionalFields(false);
            this._loadOptionalSettings();
          } else if (!this._isTenantSelected()) {
            this._resetOptionalFields(false);
          }
        });

    this.form.controls.tenant.valueChanges.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(value => {
          value ? this._disableControl(this.form.controls.tenantID) : this._enableControl(this.form.controls.tenantID);

          if (this._isTenantSelected()) {
            this._resetOptionalFields(false);
            this._loadOptionalSettings();
          } else if (!this._isTenantIDSelected()) {
            this._resetOptionalFields(false);
          }
        });

    this.form.controls.network.valueChanges.pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((network) => {
          if (this._isNetworkSelected()) {
            this._loadSubnetIds();
          }
        });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._checkState();
      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => this.hideOptional = data.hideOptional);

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  isFloatingIPEnforced(): boolean {
    return this._wizard.getSelectedDatacenter().spec.openstack.enforce_floating_ip;
  }

  showHint(field: string): boolean {
    switch (field) {
      case 'tenant':
        return !this._loadingOptionalTenants && !this._hasTenantCredentials();
      case 'subnetId':
        return !this._loadingSubnetIds && (!this._hasRequiredCredentials() || this.form.controls.network.value === '');
      case 'optionalSettings':
        return !this._loadingOptionalSettings && !this._hasRequiredCredentials();
      default:
        return false;
    }
  }

  getTenantsFormState(): string {
    if (!this._loadingOptionalTenants && !this._hasTenantCredentials()) {
      return 'Project';
    } else if (this._loadingOptionalTenants) {
      return 'Loading Projects...';
    } else if (!this._loadingOptionalTenants && this.tenants.length === 0) {
      return 'No Projects available';
    } else {
      return 'Project';
    }
  }

  getOptionalSettingsFormState(field: string): string {
    if (!this._loadingOptionalSettings && !this._hasRequiredCredentials()) {
      return field;
    } else if (this._loadingOptionalSettings) {
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
    if (!this._loadingSubnetIds && (!this._hasRequiredCredentials() || this.form.controls.network.value === '')) {
      return 'Subnet ID';
    } else if (this._loadingSubnetIds) {
      return 'Loading Subnet IDs...';
    } else if (this.form.controls.network.value !== '' && this.subnetIds.length === 0) {
      return 'No Subnet IDs available';
    } else {
      return 'Subnet ID';
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _loadTenants(): void {
    if (!this._hasTenantCredentials()) {
      return;
    }

    this._loadingOptionalTenants = true;
    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .domain(this.form.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .tenants()
        .pipe(take(1))
        .subscribe(
            (tenants) => {
              this.tenants = tenants.sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              if (this.tenants.length === 0) {
                this.form.controls.tenant.setValue('');
              }

              this._loadingOptionalTenants = false;
              this._checkState();
            },
            () => {
              this.tenants = [];
              this._loadingOptionalTenants = false;
            });
  }

  private _loadOptionalSettings(): void {
    if (!this._hasRequiredCredentials()) {
      return;
    }

    this._loadingOptionalSettings = true;
    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .tenant(this.form.controls.tenant.value)
        .tenantID(this.form.controls.tenantID.value)
        .domain(this.form.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .networks()
        .pipe(take(1))
        .subscribe((networks: OpenstackNetwork[]) => {
          this.networks = networks.filter((network) => network.external !== true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });
          this.floatingIpPools = networks.filter((network) => network.external === true).sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.networks.length === 0) {
            this.form.controls.network.setValue('');
          }

          if (this.floatingIpPools.length === 0) {
            this.form.controls.floatingIpPool.setValue('');
          }

          this._checkState();
        });

    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .tenant(this.form.controls.tenant.value)
        .tenantID(this.form.controls.tenantID.value)
        .domain(this.form.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .securityGroups()
        .pipe(take(1))
        .subscribe((securityGroups) => {
          this.securityGroups = securityGroups.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.securityGroups.length === 0) {
            this.form.controls.securityGroup.setValue('');
          }

          this._loadingOptionalSettings = false;
        });
  }

  private _loadSubnetIds(): void {
    if (!this._hasRequiredCredentials() || this.form.controls.network.value === '') {
      return;
    }

    this._loadingSubnetIds = true;
    this._wizard.provider(NodeProvider.OPENSTACK)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .tenant(this.form.controls.tenant.value)
        .tenantID(this.form.controls.tenantID.value)
        .domain(this.form.controls.domain.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .subnets(this.form.controls.network.value)
        .pipe(take(1))
        .subscribe((subnets) => {
          this.subnetIds = subnets.sort((a, b) => {
            return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
          });

          if (this.subnetIds.length === 0) {
            this.form.controls.subnetId.setValue('');
          }

          this._loadingSubnetIds = false;
          this._checkState();
        });
  }

  private _resetOptionalFields(withTenant: boolean): void {
    if (withTenant) {
      this.form.controls.tenant.setValue('');
      this.tenants = [];
    }

    this.form.controls.network.setValue('');
    this.form.controls.floatingIpPool.setValue('');
    this.form.controls.securityGroup.setValue('');
    this.form.controls.subnetId.setValue('');
    this.networks = [];
    this.floatingIpPools = [];
    this.securityGroups = [];
    this.subnetIds = [];
    this._checkState();
  }

  private _checkState(): void {
    const fields: OpenstackOptionalFields[] = [
      {'length': this.floatingIpPools.length, 'name': 'floatingIpPool'},
      {'length': this.securityGroups.length, 'name': 'securityGroup'},
      {'length': this.networks.length, 'name': 'network'},
      {'length': this.subnetIds.length, 'name': 'subnetId'},
    ];

    for (const i in fields) {
      if (fields[i].length === 0) {
        this._disableControl(this.form.get(fields[i].name));
      } else {
        this._enableControl(this.form.get(fields[i].name));
      }
    }

    if (this.tenants.length === 0) {
      this._disableControl(this.form.controls.tenant);
    } else if (this.tenants.length > 0 && !this.form.controls.tenantID.value) {
      this._enableControl(this.form.controls.tenant);
    }
  }

  private _disableControl(control: AbstractControl): void {
    if (control.enabled) {
      control.disable();
    }
  }

  private _enableControl(control: AbstractControl): void {
    if (control.disabled) {
      control.enable();
    }
  }

  private _hasTenantCredentials(): boolean {
    return !(
        this.form.controls.username.value === '' || this.form.controls.password.value === '' ||
        this.form.controls.domain.value === '');
  }

  private _hasRequiredCredentials(): boolean {
    return this._hasTenantCredentials() && (this._isTenantSelected() || this._isTenantIDSelected());
  }

  private _isTenantSelected(): boolean {
    return this.form.controls.tenant.value.toString().length > 0;
  }

  private _isTenantIDSelected(): boolean {
    return this.form.controls.tenantID.value;
  }

  private _isNetworkSelected(): boolean {
    return this.form.controls.network.value.toString().length > 0;
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        openstack: {
          tenant: this.form.controls.tenant.value,
          tenantID: this.form.controls.tenantID.value,
          domain: this.form.controls.domain.value,
          username: this.form.controls.username.value,
          password: this.form.controls.password.value,
          floatingIpPool: this.form.controls.floatingIpPool.value,
          securityGroups: this.form.controls.securityGroup.value,
          network: this.form.controls.network.value,
          subnetID: this.form.controls.subnetId.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
