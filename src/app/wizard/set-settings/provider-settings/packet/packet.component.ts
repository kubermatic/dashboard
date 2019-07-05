import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {AVAILABLE_PACKET_BILLING_CYCLES} from '../../../../shared/entity/cloud/PacketCloudSpec';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-packet-cluster-settings',
  templateUrl: './packet.component.html',
})
export class PacketClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private _wizard: WizardService) {}

  ngOnInit(): void {
    const billingCycle = !!this.cluster.spec.cloud.packet.billingCycle ? this.cluster.spec.cloud.packet.billingCycle :
                                                                         this.getAvailableBillingCycles()[0];

    this.form = new FormGroup({
      apiKey: new FormControl(this.cluster.spec.cloud.packet.apiKey, [Validators.required, Validators.maxLength(256)]),
      projectID:
          new FormControl(this.cluster.spec.cloud.packet.projectID, [Validators.required, Validators.maxLength(256)]),
      billingCycle: new FormControl(billingCycle, [Validators.maxLength(64)]),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(this.form.controls.apiKey, this.form.controls.projectID);

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  getAvailableBillingCycles(): string[] {
    return AVAILABLE_PACKET_BILLING_CYCLES;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        packet: {
          apiKey: this.form.controls.apiKey.value,
          projectID: this.form.controls.projectID.value,
          billingCycle: this.form.controls.billingCycle.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
