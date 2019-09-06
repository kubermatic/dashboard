import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-vsphere-cluster-settings',
  templateUrl: './vsphere.component.html',
})
export class VSphereClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      infraManagementUsername:
          new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.username, Validators.required),
      infraManagementPassword:
          new FormControl(this.cluster.spec.cloud.vsphere.infraManagementUser.password, Validators.required),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.infraManagementUsername,
        this.form.controls.infraManagementPassword,
    );

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.cluster.spec.cloud.vsphere = data.cloudSpec.vsphere;
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
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

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        vsphere: {
          username: this.cluster.spec.cloud.vsphere.username,
          password: this.cluster.spec.cloud.vsphere.password,
          vmNetName: this.cluster.spec.cloud.vsphere.vmNetName,
          folder: this.cluster.spec.cloud.vsphere.folder,
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
