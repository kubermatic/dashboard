import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';

@Component({
  selector: 'kubermatic-aws-cluster-settings',
  templateUrl: './aws.component.html',
})
export class AWSClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;
  hideOptional = true;

  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, Validators.required),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, Validators.required),
      securityGroup:
          new FormControl(this.cluster.spec.cloud.aws.securityGroup, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      vpcId: new FormControl(this.cluster.spec.cloud.aws.vpcId, Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      subnetId: new FormControl(this.cluster.spec.cloud.aws.subnetId, Validators.pattern('subnet-(\\w{8}|\\w{17})')),
      routeTableId:
          new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      instanceProfileName: new FormControl(this.cluster.spec.cloud.aws.instanceProfileName),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.accessKeyId,
        this.form.controls.secretAccessKey,
    );

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._formHelper.areControlsValid() ? this._wizardService.onCustomCredentialsDisable.emit(false) :
                                            this._wizardService.onCustomCredentialsDisable.emit(true);

      this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.onCustomCredentialsSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
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
        aws: {
          accessKeyId: this.form.controls.accessKeyId.value,
          secretAccessKey: this.form.controls.secretAccessKey.value,
          securityGroup: this.form.controls.securityGroup.value,
          vpcId: this.form.controls.vpcId.value,
          subnetId: this.form.controls.subnetId.value,
          routeTableId: this.form.controls.routeTableId.value,
          instanceProfileName: this.form.controls.instanceProfileName.value,
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
