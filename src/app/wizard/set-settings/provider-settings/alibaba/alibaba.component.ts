import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'km-alibaba-cluster-settings',
  templateUrl: './alibaba.component.html',
})
export class AlibabaClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyID: new FormControl(this.cluster.spec.cloud.alibaba.accessKeyID, Validators.required),
      accessKeySecret: new FormControl(this.cluster.spec.cloud.alibaba.accessKeySecret, Validators.required),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(this.form.controls.accessKeyID, this.form.controls.accessKeySecret);

    this.form.valueChanges
      .pipe(debounceTime(1000))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(data => {
        this._wizard.onCustomPresetsDisable.emit(!this._formHelper.areControlsValid());

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

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        alibaba: {
          accessKeyID: this.form.controls.accessKeyID.value,
          accessKeySecret: this.form.controls.accessKeySecret.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
