// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, first, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../../core/services/wizard/wizard.service';
import {Cluster} from '../../../../../shared/entity/cluster';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {GCPNetwork, GCPSubnetwork} from '../../../../../shared/entity/provider/gcp';

@Component({
  selector: 'km-gcp-provider-options',
  templateUrl: './gcp-provider-options.component.html',
})
export class GCPProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;

  hideOptional = true;
  form: FormGroup;
  networks: GCPNetwork[] = [];
  subnetworks: GCPSubnetwork[] = [];

  private _loadingNetworks = false;
  private _loadingSubnetworks = false;
  private _selectedPreset: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      network: new FormControl(this.cluster.spec.cloud.gcp.network),
      subnetwork: new FormControl(this.cluster.spec.cloud.gcp.subnetwork),
    });

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._hasRequiredCredentials())
        );
      });

    this.form.controls.network.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        if (this._hasRequiredCredentials && this.form.controls.network.value !== '') {
          this._loadSubnetworks();
          this.checkSubnetworkState();
        } else {
          this.clearSubnetwork();
        }
      });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      if (
        data.cloudSpec.gcp.serviceAccount !== this.cluster.spec.cloud.gcp.serviceAccount ||
        data.cloudSpec.gcp.network === ''
      ) {
        this.cluster.spec.cloud.gcp = data.cloudSpec.gcp;
        if (this._hasRequiredCredentials()) {
          this._loadNetworks();
          this.checkNetworkState();
        } else {
          this.clearNetwork();
        }
      } else if (data.cloudSpec.gcp.serviceAccount === '') {
        this.clearNetwork();
      }

      this.cluster.spec.cloud.gcp = data.cloudSpec.gcp;
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe(data => {
      this.hideOptional = data.hideOptional;
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

  private _hasRequiredCredentials(): boolean {
    return this.cluster.spec.cloud.gcp.serviceAccount !== '' || !!this._selectedPreset;
  }

  private _loadNetworks(): void {
    if (!this._hasRequiredCredentials()) {
      return;
    }

    this._loadingNetworks = true;
    this._wizardService
      .provider(NodeProvider.GCP)
      .serviceAccount(this.cluster.spec.cloud.gcp.serviceAccount)
      .networks()
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        networks => {
          this.networks = networks.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          if (this.networks.length === 0) {
            this.form.controls.network.setValue('');
          }

          this._loadingNetworks = false;
          this.checkNetworkState();
        },
        () => {
          this._loadingNetworks = false;
        }
      );
  }

  private _loadSubnetworks(): void {
    if (!this._hasRequiredCredentials() || this.form.controls.network.value === '') {
      return;
    }

    this._loadingSubnetworks = true;
    this._wizardService
      .provider(NodeProvider.GCP)
      .serviceAccount(this.cluster.spec.cloud.gcp.serviceAccount)
      .network(this.form.controls.network.value)
      .subnetworks(this.cluster.spec.cloud.dc)
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(
        subnetworks => {
          this.subnetworks = subnetworks.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });

          if (this.subnetworks.length === 0) {
            this.form.controls.subnetwork.setValue('');
          }

          this._loadingSubnetworks = false;
          this.checkSubnetworkState();
        },
        () => {
          this._loadingSubnetworks = false;
        }
      );
  }

  getNetworkFormState(): string {
    if (!this._loadingNetworks && !this._hasRequiredCredentials()) {
      return 'Network';
    } else if (this._loadingNetworks && !this._selectedPreset) {
      return 'Loading Networks...';
    } else if (this.networks.length === 0 && !this._selectedPreset) {
      return 'No Networks available';
    }
    return 'Network';
  }

  getSubnetworkFormState(): string {
    if (!this._loadingSubnetworks && (!this._hasRequiredCredentials() || this.form.controls.network.value === '')) {
      return 'Subnetwork';
    } else if (this._loadingSubnetworks && !this._selectedPreset) {
      return 'Loading Subnetworks...';
    } else if (this.form.controls.network.value !== '' && this.subnetworks.length === 0 && !this._selectedPreset) {
      return 'No Subnetworks available';
    }
    return 'Subnetwork';
  }

  showNetworkHint(): boolean {
    return !this._loadingNetworks && !this._hasRequiredCredentials();
  }

  getSubnetworkHint(): string {
    if (!this._loadingSubnetworks && this.form.controls.network.value === '') {
      return this._hasRequiredCredentials() ? 'Please enter a network first.' : 'Please enter valid credentials first.';
    }
    return '';
  }

  checkNetworkState(): void {
    if (this.networks.length === 0 && this.form.controls.network.enabled) {
      this.form.controls.network.disable();
    } else if (this.networks.length > 0 && this.form.controls.network.disabled) {
      this.form.controls.network.enable();
    }
  }

  checkSubnetworkState(): void {
    if (this.subnetworks.length === 0 && this.form.controls.subnetwork.enabled) {
      this.form.controls.subnetwork.disable();
    } else if (this.subnetworks.length > 0 && this.form.controls.subnetwork.disabled) {
      this.form.controls.subnetwork.enable();
    }
  }

  clearNetwork(): void {
    this.networks = [];
    this.form.controls.network.setValue('');
    this.checkNetworkState();
  }

  clearSubnetwork(): void {
    this.subnetworks = [];
    this.form.controls.subnetwork.setValue('');
    this.checkSubnetworkState();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(isValid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        gcp: {
          serviceAccount: this.cluster.spec.cloud.gcp.serviceAccount,
          network: this.form.controls.network.value,
          subnetwork: this.form.controls.subnetwork.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }
}
