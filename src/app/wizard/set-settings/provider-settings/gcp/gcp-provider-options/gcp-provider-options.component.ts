import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {GCPNetwork} from '../../../../../shared/entity/provider/gcp/GCP';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-gcp-provider-options',
  templateUrl: './gcp-provider-options.component.html',
})
export class GCPProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  hideOptional = true;
  form: FormGroup;
  networks: GCPNetwork[] = [];

  private _loadingNetworks = false;
  private _selectedPreset: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      network: new FormControl(this.cluster.spec.cloud.gcp.network),
      subnetwork: new FormControl(this.cluster.spec.cloud.gcp.subnetwork),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._hasRequiredCredentials()));
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.cloudSpec.gcp.serviceAccount !== this.cluster.spec.cloud.gcp.serviceAccount ||
          data.cloudSpec.gcp.network === '') {
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

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
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
    this._wizardService.provider(NodeProvider.GCP)
        .serviceAccount(this.cluster.spec.cloud.gcp.serviceAccount)
        .networks()
        .pipe(take(1))
        .subscribe(
            (networks) => {
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
            });
  }

  getNetworkFormState(): string {
    if (!this._loadingNetworks && !this._hasRequiredCredentials()) {
      return 'Network';
    } else if (this._loadingNetworks && !this._selectedPreset) {
      return 'Loading Networks...';
    } else if (this.networks.length === 0 && !this._selectedPreset) {
      return 'No Networks available';
    } else {
      return 'Network';
    }
  }

  getNetworkHint(): boolean {
    return !this._loadingNetworks && !this._hasRequiredCredentials();
  }

  checkNetworkState(): void {
    if (this.networks.length === 0 && this.form.controls.network.enabled) {
      this.form.controls.network.disable();
    } else if (this.networks.length > 0 && this.form.controls.network.disabled) {
      this.form.controls.network.enable();
    }
  }

  clearNetwork(): void {
    this.networks = [];
    this.form.controls.network.setValue('');
    this.checkNetworkState();
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
