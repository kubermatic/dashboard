import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-gcp-provider-options',
  templateUrl: './gcp-provider-options.component.html',
})
export class GCPProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  hideOptional = true;
  form: FormGroup;

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
      this.cluster.spec.cloud.gcp = data.cloudSpec.gcp;
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this._selectedPreset = newCredentials;
        this.form.disable();
        return;
      } else {
        this._selectedPreset = '';
      }

      this.form.enable();
    });
  }

  private _hasRequiredCredentials(): boolean {
    return this.cluster.spec.cloud.gcp.serviceAccount !== '' || !!this._selectedPreset;
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
