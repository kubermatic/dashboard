import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {VSphereFolder, VSphereNetwork} from '../../../../shared/entity/provider/vsphere/VSphereEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-vsphere-cluster-settings',
  templateUrl: './vsphere.component.html',
})
export class VSphereClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;
  hideOptional = true;
  loadingNetworks = false;
  loadingFolders = false;
  folders: VSphereFolder[] = [];

  private _networkMap: {[type: string]: VSphereNetwork[]} = {};
  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      infraManagementUsername:
          new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.username, Validators.required),
      infraManagementPassword:
          new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.password, Validators.required),
      username: new FormControl(this.cluster.spec.cloud.vsphere.username),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
      folder: new FormControl(this.cluster.spec.cloud.vsphere.folder),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.infraManagementUsername,
        this.form.controls.infraManagementPassword,
    );

    this.checkNetworkState();

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.loadNetworks();
      this.checkNetworkState();
      this.loadFolders();
      this.checkFolderState();

      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  isMissingCredentials(): boolean {
    return this.form.controls.username.value === '' || this.form.controls.password.value === '';
  }

  loadNetworks(): void {
    if (this.isMissingCredentials()) {
      if (this.networkTypes.length > 0) {
        this.form.controls.vmNetName.setValue('');
        this._networkMap = {};
        return;
      }
      return;
    }

    if (this.networkTypes.length > 0) {
      return;
    }

    this.loadingNetworks = true;
    this._wizard.provider(NodeProvider.VSPHERE)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .networks()
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((networks) => {
          if (networks.length > 0) {
            this._networkMap = {};
            networks.forEach(network => {
              const find = this.networkTypes.find(x => x === network.type);
              if (!find) {
                this._networkMap[network.type] = [];
              }
              this._networkMap[network.type].push(network);
            });

            if (this.form.controls.vmNetName.value !== '0') {
              this.form.controls.vmNetName.setValue(this.cluster.spec.cloud.vsphere.vmNetName);
            }
          } else {
            this._networkMap = {};
          }
          this.loadingNetworks = false;
        });
  }

  get networkTypes(): string[] {
    return Object.keys(this._networkMap);
  }

  getNetworks(type: string): VSphereNetwork[] {
    return this._networkMap[type];
  }

  getNetworkFormState(): string {
    if (!this.loadingNetworks && this.isMissingCredentials()) {
      return 'Network';
    } else if (this.loadingNetworks) {
      return 'Loading Networks...';
    } else if (!this.loadingNetworks && this.networkTypes.length === 0) {
      return 'No Networks available';
    } else {
      return 'Network';
    }
  }

  checkNetworkState(): void {
    if (this.networkTypes.length === 0 && this.form.controls.vmNetName.enabled) {
      this.form.controls.vmNetName.disable();
    } else if (this.networkTypes.length > 0 && this.form.controls.vmNetName.disabled) {
      this.form.controls.vmNetName.enable();
    }
  }

  showNetworkHint(): boolean {
    return !this.loadingNetworks && this.isMissingCredentials();
  }

  loadFolders(): void {
    if (this.isMissingCredentials()) {
      if (this.folders.length > 0) {
        this.form.controls.folder.setValue('');
        this.folders = [];
        return;
      }
      return;
    }

    if (this.folders.length > 0) {
      return;
    }

    this.loadingFolders = true;
    this._wizard.provider(NodeProvider.VSPHERE)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .folders()
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((folders) => {
          if (folders.length > 0) {
            const sortedFolders = folders.sort((a, b) => {
              return (a.path < b.path ? -1 : 1) * ('asc' ? 1 : -1);
            });

            this.folders = sortedFolders;
            if (sortedFolders.length > 0 && this.form.controls.folder.value !== '0') {
              this.form.controls.folder.setValue(this.cluster.spec.cloud.vsphere.folder);
            }
          } else {
            this.folders = [];
          }
          this.loadingFolders = false;
        });
  }

  getFolderFormState(): string {
    if (!this.loadingFolders && this.isMissingCredentials()) {
      return 'Folder';
    } else if (this.loadingFolders) {
      return 'Loading Folders...';
    } else if (!this.loadingFolders && this.folders.length === 0) {
      return 'No Folders available';
    } else {
      return 'Folder';
    }
  }

  checkFolderState(): void {
    if (this.folders.length === 0 && this.form.controls.folder.enabled) {
      this.form.controls.folder.disable();
    } else if (this.folders.length > 0 && this.form.controls.folder.disabled) {
      this.form.controls.folder.enable();
    }
  }

  showFolderHint(): boolean {
    return !this.loadingFolders && this.isMissingCredentials();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    let cloudUser = this.form.controls.infraManagementUsername.value;
    let cloudPassword = this.form.controls.infraManagementPassword.value;

    if (this.form.controls.username.value !== '' && this.form.controls.password.value !== '') {
      cloudUser = this.form.controls.username.value;
      cloudPassword = this.form.controls.password.value;
    }

    return {
      cloudSpec: {
        vsphere: {
          username: cloudUser,
          password: cloudPassword,
          vmNetName: this.form.controls.vmNetName.value,
          folder: this.form.controls.folder.value,
          infraManagementUser: {
            username: this.form.controls.infraManagementUsername.value,
            password: this.form.controls.infraManagementPassword.value,
          },
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
