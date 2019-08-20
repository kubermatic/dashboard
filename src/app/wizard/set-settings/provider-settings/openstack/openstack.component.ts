import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {merge, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, take, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../../app-config.service';
import {Auth, WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {OpenstackFloatingIpPool, OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
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
  private _loadingTenants = false;
  private _config: Config;
  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();
  private _debounceTime = 500;

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
      username: new FormControl(this.cluster.spec.cloud.openstack.username, [Validators.required]),
      password: new FormControl(this.cluster.spec.cloud.openstack.password, [Validators.required]),
      tenant: new FormControl({value: '', disabled: true}, [Validators.required]),
      tenantID: new FormControl({value: '', disabled: true}, [Validators.required]),
      floatingIpPool: new FormControl({value: '', disabled: true}),
      securityGroup: new FormControl({value: '', disabled: true}),
      network: new FormControl({value: '', disabled: true}),
      subnetId: new FormControl({value: '', disabled: true}),
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

    merge(
        this.form.controls.domain.valueChanges, this.form.controls.username.valueChanges,
        this.form.controls.password.valueChanges)
        .pipe(debounceTime(this._debounceTime))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          this._resetControls(...this._getOptionalControls(), ...this._getTenantControls());

          if (this._hasTenantCredentials()) {
            this._enableTenant(true);
            this._enableTenantID(true);
            this._loadTenants();
          }

          if (this._isTenantSelected()) {
            this._enableTenantID(false);
          }

          if (this._isTenantIDSelected()) {
            this._enableTenant(false);
          }
        });

    this.form.controls.tenant.statusChanges.pipe(debounceTime(this._debounceTime))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((status: string) => {
          if (!this._hasTenantCredentials()) {
            this._resetControls(...this._getTenantControls());
            this.tenants = [];
          }
        });

    this.form.controls.tenant.valueChanges.pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((value: string) => {
          this._enableTenantID(value === '');
        });

    this.form.controls.tenantID.valueChanges.pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((value: string) => {
          this._enableTenant(value === '');
        });

    merge(this.form.controls.tenant.valueChanges, this.form.controls.tenantID.valueChanges)
        .pipe(distinctUntilChanged())
        .pipe(debounceTime(this._debounceTime))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          this._resetControls(...this._getOptionalControls());

          if (this._hasRequiredCredentials()) {
            this._loadOptionalSettings();
          }

          this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
        });

    merge(
        this.form.controls.floatingIpPool.valueChanges, this.form.controls.floatingIpPool.statusChanges,
        this.form.controls.network.valueChanges, this.form.controls.subnetId.valueChanges,
        this.form.controls.securityGroup.valueChanges)
        .pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
        });

    this.form.controls.network.valueChanges.pipe(distinctUntilChanged())
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          if (this._isNetworkSelected()) {
            this._loadSubnetIds();
          } else {
            this._resetControls(this.form.controls.subnetId);
          }
        });

    this.form.valueChanges
        .pipe(distinctUntilChanged(
            (x: {[key: string]: string}, y: {[key: string]: string}): boolean =>
                Object.keys(y).every(key => (!(key in x) && y[key] === '') || x[key] === y[key])))
        .pipe(debounceTime(this._debounceTime))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            () => this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                                        this._wizard.onCustomPresetsDisable.emit(true));

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe))
        .subscribe((data) => this.hideOptional = data.hideOptional);

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
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
        return !this._loadingTenants && !this._hasTenantCredentials();
      case 'subnetId':
        return !this._loadingSubnetIds && (!this._hasRequiredCredentials() || this.form.controls.network.value === '');
      case 'optionalSettings':
        return !this._loadingOptionalSettings && !this._hasRequiredCredentials();
      default:
        return false;
    }
  }

  getTenantsFormState(): string {
    if (!this._loadingTenants && !this._hasTenantCredentials()) {
      return 'Project';
    } else if (this._loadingTenants) {
      return 'Loading Projects...';
    } else if (!this._loadingTenants && this.tenants.length === 0) {
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
    this._loadingTenants = true;
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

              this._loadingTenants = false;
            },
            () => {
              this.tenants = [];
              this._loadingTenants = false;
            },
            () => {
              this._loadingTenants = false;
            });
  }

  private _loadOptionalSettings(): void {
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
        .subscribe(
            (networks: OpenstackNetwork[]) => {
              this.networks = networks.filter((network) => network.external !== true).sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });
              this.floatingIpPools = networks.filter((network) => network.external === true).sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              this._enableNetwork(this.networks.length !== 0);
              this._enableFloatingIP(this.floatingIpPools.length !== 0);
            },
            () => {
              this._loadingOptionalSettings = false;
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
        .subscribe(
            (securityGroups) => {
              this.securityGroups = securityGroups.sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              this._enableSecurityGroup(this.securityGroups.length !== 0);
              this._loadingOptionalSettings = false;
            },
            () => {
              this._loadingOptionalSettings = false;
            });
  }

  private _loadSubnetIds(): void {
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
        .subscribe(
            (subnets) => {
              this.subnetIds = subnets.sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              if (this.subnetIds.length === 0) {
                this.form.controls.subnetId.setValue('');
              }

              this._enableSubnetID(this.subnetIds.length !== 0);
              this._loadingSubnetIds = false;
            },
            () => {
              this._loadingSubnetIds = false;
            });
  }

  private _resetControls(...controls: AbstractControl[]): void {
    for (const control of controls) {
      if (control.enabled) {
        control.disable();
        control.setValue('');
      }
    }
  }

  private _enableTenant(enable: boolean): void {
    this._enableControl(enable, this.form.controls.tenant);
  }

  private _enableTenantID(enable: boolean): void {
    this._enableControl(enable, this.form.controls.tenantID);
  }

  private _enableFloatingIP(enable: boolean): void {
    this._enableControl(enable, this.form.controls.floatingIpPool);
  }

  private _enableNetwork(enable: boolean): void {
    this._enableControl(enable, this.form.controls.network);
  }

  private _enableSecurityGroup(enable: boolean): void {
    this._enableControl(enable, this.form.controls.securityGroup);
  }

  private _enableSubnetID(enable: boolean): void {
    this._enableControl(enable, this.form.controls.subnetId);
  }

  private _enableControl(enable: boolean, control: AbstractControl): void {
    if (enable && control.disabled) {
      control.enable();
    } else if (!enable && control.enabled) {
      control.disable();
    }
  }

  private _getTenantControls(): AbstractControl[] {
    return [
      this.form.controls.tenant,
      this.form.controls.tenantID,
    ];
  }

  private _getOptionalControls(): AbstractControl[] {
    return [
      this.form.controls.network,
      this.form.controls.floatingIpPool,
      this.form.controls.securityGroup,
      this.form.controls.subnetId,
    ];
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
    return this.form.controls.tenantID.value.toString().length > 0;
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
