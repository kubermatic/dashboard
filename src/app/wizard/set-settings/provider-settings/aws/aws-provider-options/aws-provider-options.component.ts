import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../../core/services';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';

@Component({
  selector: 'kubermatic-aws-provider-options',
  templateUrl: './aws-provider-options.component.html',
})
export class AWSProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;

  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      securityGroup:
          new FormControl(this.cluster.spec.cloud.aws.securityGroup, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      routeTableId:
          new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      instanceProfileName: new FormControl(this.cluster.spec.cloud.aws.instanceProfileName),
      roleARN: new FormControl(this.cluster.spec.cloud.aws.roleARN),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm());
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  private _hasRequiredCredentials(): boolean {
    return this.cluster.spec.cloud.aws.accessKeyId !== '' && this.cluster.spec.cloud.aws.secretAccessKey !== '';
  }

  private _clusterProviderSettingsForm(): ClusterProviderSettingsForm {
    const isValid: boolean = this._hasRequiredCredentials();

    return {
      cloudSpec: {
        aws: {
          accessKeyId: this.cluster.spec.cloud.aws.accessKeyId,
          secretAccessKey: this.cluster.spec.cloud.aws.secretAccessKey,
          vpcId: this.cluster.spec.cloud.aws.vpcId,
          securityGroup: this.form.controls.securityGroup.value,
          routeTableId: this.form.controls.routeTableId.value,
          instanceProfileName: this.form.controls.instanceProfileName.value,
          roleARN: this.form.controls.roleARN.value,
        },
        dc: this.cluster.spec.cloud.dc,
      },
      valid: isValid,
    };
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
