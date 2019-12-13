import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../../core/services';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {VSphereFolder, VSphereNetwork} from '../../../../../shared/entity/provider/vsphere/VSphereEntity';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-vsphere-provider-options',
  templateUrl: './vsphere-provider-options.component.html',
})

export class VSphereProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  form: FormGroup;
  loadingNetworks = false;
  loadingFolders = false;
  hideOptional = true;
  folders: VSphereFolder[] = [];

  private _selectedPreset: string;
  private _networkMap: {[type: string]: VSphereNetwork[]} = {};
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      username: new FormControl(this.cluster.spec.cloud.vsphere.username),
      password: new FormControl(this.cluster.spec.cloud.vsphere.password),
      vmNetName: new FormControl(this.cluster.spec.cloud.vsphere.vmNetName),
      folder: new FormControl(this.cluster.spec.cloud.vsphere.folder),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._wizardService.changeClusterProviderSettings(this.getVSphereOptionsData(this._hasRequiredCredentials()));
    });

    this.checkNetworkState();
    this.checkFolderState();
    this._setUsernamePassword();
    this._wizardService.changeClusterProviderSettings(this.getVSphereOptionsData(this._hasRequiredCredentials()));

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cluster.spec.cloud.vsphere = data.cloudSpec.vsphere;
      this._setUsernamePassword();
      if (this._hasRequiredCredentials()) {
        this.loadNetworks();
        this.checkNetworkState();
        this.loadFolders();
        this.checkFolderState();
      } else {
        this.clearNetworks();
        this.clearFolders();
      }
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      this._selectedPreset = newCredentials;
      if (newCredentials) {
        this.form.disable();
        return;
      }
      this.form.enable();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  clearNetworks(): void {
    this._networkMap = {};
    this.form.controls.vmNetName.setValue('');
    this.checkNetworkState();
  }

  clearFolders(): void {
    this.folders = [];
    this.form.controls.folder.setValue('');
    this.checkFolderState();
  }

  private _hasRequiredCredentials(): boolean {
    return (this.form.controls.username.value !== '' && this.form.controls.password.value !== '') ||
        !!this._selectedPreset;
  }

  private _setUsernamePassword(): void {
    if (this.cluster.spec.cloud.vsphere.infraManagementUser.username !== '' &&
        this.cluster.spec.cloud.vsphere.username === '') {
      this.form.controls.username.setValue(this.cluster.spec.cloud.vsphere.infraManagementUser.username);
    }

    if (this.cluster.spec.cloud.vsphere.infraManagementUser.password !== '' &&
        this.cluster.spec.cloud.vsphere.password === '') {
      this.form.controls.password.setValue(this.cluster.spec.cloud.vsphere.infraManagementUser.password);
    }
  }

  loadNetworks(): void {
    if (!this._hasRequiredCredentials()) {
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
    this._wizardService.provider(NodeProvider.VSPHERE)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .networks()
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            (networks) => {
              if (networks.length > 0) {
                this._networkMap = {};
                networks.forEach(network => {
                  const find = this.networkTypes.find(x => x === network.type);
                  if (!find) {
                    this._networkMap[network.type] = [];
                  }
                  this._networkMap[network.type].push(network);
                });

                this.networkTypes.forEach(type => {
                  this._networkMap[type] = this._networkMap[type].sort((a, b) => {
                    return a.name.localeCompare(b.name);
                  });
                });

                if (this.form.controls.vmNetName.value !== '0') {
                  this.form.controls.vmNetName.setValue(this.cluster.spec.cloud.vsphere.vmNetName);
                }
              } else {
                this._networkMap = {};
              }
              this.loadingNetworks = false;
              this.checkNetworkState();
            },
            () => {
              this.clearNetworks();
              this.loadingNetworks = false;
            },
            () => {
              this.loadingNetworks = false;
            });
  }

  get networkTypes(): string[] {
    return Object.keys(this._networkMap).sort((a, b) => {
      return a.localeCompare(b);
    });
  }

  getNetworks(type: string): VSphereNetwork[] {
    return this._networkMap[type];
  }

  getNetworkFormState(): string {
    if (!this.loadingNetworks && !this._hasRequiredCredentials()) {
      return 'Network';
    } else if (this.loadingNetworks && !this._selectedPreset) {
      return 'Loading Networks...';
    } else if (!this._selectedPreset && this.networkTypes.length === 0) {
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
    return !this.loadingNetworks && !this._hasRequiredCredentials();
  }

  loadFolders(): void {
    if (!this._hasRequiredCredentials()) {
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
    this._wizardService.provider(NodeProvider.VSPHERE)
        .username(this.form.controls.username.value)
        .password(this.form.controls.password.value)
        .datacenter(this.cluster.spec.cloud.dc)
        .folders()
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(
            (folders) => {
              if (folders.length > 0) {
                const sortedFolders = folders.sort((a, b) => {
                  return a.path.localeCompare(b.path);
                });

                this.folders = sortedFolders;
                if (sortedFolders.length > 0 && this.form.controls.folder.value !== '0') {
                  this.form.controls.folder.setValue(this.cluster.spec.cloud.vsphere.folder);
                }
              } else {
                this.folders = [];
              }
              this.loadingFolders = false;
            },
            () => {
              this.clearFolders();
              this.loadingFolders = false;
            },
            () => {
              this.loadingFolders = false;
            });
  }

  getFolderFormState(): string {
    if (!this.loadingFolders && !this._hasRequiredCredentials()) {
      return 'Folder';
    } else if (this.loadingFolders && !this._selectedPreset) {
      return 'Loading Folders...';
    } else if (!this._selectedPreset && this.folders.length === 0) {
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
    return !this.loadingFolders && !this._hasRequiredCredentials();
  }

  getVSphereOptionsData(isValid: boolean): ClusterProviderSettingsForm {
    let cloudUser = this.cluster.spec.cloud.vsphere.infraManagementUser.username;
    let cloudPassword = this.cluster.spec.cloud.vsphere.infraManagementUser.password;

    if (this.form.controls.username.value !== '' && this.form.controls.password.value !== '') {
      cloudUser = this.form.controls.username.value;
      cloudPassword = this.form.controls.password.value;
    }

    return {
      cloudSpec: {
        vsphere: {
          infraManagementUser: {
            username: this.cluster.spec.cloud.vsphere.infraManagementUser.username,
            password: this.cluster.spec.cloud.vsphere.infraManagementUser.password,
          },
          username: cloudUser,
          password: cloudPassword,
          vmNetName: this.form.controls.vmNetName.value,
          folder: this.form.controls.folder.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }
}
