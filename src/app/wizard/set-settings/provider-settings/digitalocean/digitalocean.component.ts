import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services/wizard/wizard.service';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-digitalocean-cluster-settings',
  templateUrl: './digitalocean.component.html',
})
export class DigitaloceanClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;
  tokenRequired = true;

  private _formHelper: FormHelper;
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      token: new FormControl(
          this.cluster.spec.cloud.digitalocean.token, [Validators.minLength(64), Validators.maxLength(64)]),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(this.form.controls.token);

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizardService.onCustomCredentialsDisable.emit(false) :
                                            this._wizardService.onCustomCredentialsDisable.emit(true);

      this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizardService.onCustomCredentialsSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        this.tokenRequired = false;
        this._wizardService.changeClusterProviderSettings(this._clusterProviderSettingsForm(true));
        return;
      }

      this.form.enable();
      this.tokenRequired = true;
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        digitalocean: {
          token: this.form.controls.token.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid,
    };
  }
}
