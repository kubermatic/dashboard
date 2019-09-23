import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {merge, Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {AWSVPC} from '../../../../shared/entity/provider/aws/AWS';
import {ClusterProviderSettingsForm} from '../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {FormHelper} from '../../../../shared/utils/wizard-utils/wizard-utils';


@Component({
  selector: 'kubermatic-aws-cluster-settings',
  templateUrl: './aws.component.html',
})
export class AWSClusterSettingsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  form: FormGroup;
  hideOptional = true;
  vpcIds: AWSVPC[] = [];

  private _loadingVPCs = false;
  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      accessKeyId: new FormControl(this.cluster.spec.cloud.aws.accessKeyId, Validators.required),
      secretAccessKey: new FormControl(this.cluster.spec.cloud.aws.secretAccessKey, Validators.required),
      securityGroupID:
          new FormControl(this.cluster.spec.cloud.aws.securityGroupID, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      vpcId: new FormControl(this.cluster.spec.cloud.aws.vpcId, Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      routeTableId:
          new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      instanceProfileName: new FormControl(this.cluster.spec.cloud.aws.instanceProfileName),
      roleARN: new FormControl(this.cluster.spec.cloud.aws.roleARN),
    });

    this._formHelper = new FormHelper(this.form);
    this._formHelper.registerFormControls(
        this.form.controls.accessKeyId,
        this.form.controls.secretAccessKey,
    );

    this._loadVPCs();
    this.checkVPCState();

    merge(this.form.controls.accessKeyId.valueChanges, this.form.controls.secretAccessKey.valueChanges)
        .pipe(debounceTime(1000))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => {
          if (this._hasRequiredCredentials()) {
            this._loadVPCs();
            this.checkVPCState();
          } else {
            this.clearVpcId();
          }
        });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._formHelper.areControlsValid() ? this._wizard.onCustomPresetsDisable.emit(false) :
                                            this._wizard.onCustomPresetsDisable.emit(true);

      this._wizard.changeClusterProviderSettings(this._clusterProviderSettingsForm(this._formHelper.isFormValid()));
    });

    this._wizard.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
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
    return !(this.form.controls.accessKeyId.value === '' || this.form.controls.secretAccessKey.value === '');
  }

  clearVpcId(): void {
    this.vpcIds = [];
    this.form.controls.vpcId.setValue('');
    this.checkVPCState();
  }

  getVPCFormState(): string {
    if (!this._loadingVPCs && !this._hasRequiredCredentials()) {
      return 'VPC ID';
    } else if (this._loadingVPCs) {
      return 'Loading VPC IDs...';
    } else if (this.vpcIds.length === 0) {
      return 'No VPC IDs available';
    } else {
      return 'VPC ID';
    }
  }

  private _loadVPCs(): void {
    if (!this._hasRequiredCredentials()) {
      return;
    }

    this._loadingVPCs = true;
    this._wizard.provider(NodeProvider.AWS)
        .accessKeyID(this.form.controls.accessKeyId.value)
        .secretAccessKey(this.form.controls.secretAccessKey.value)
        .vpcs(this.cluster.spec.cloud.dc)
        .pipe(take(1))
        .subscribe(
            (vpcs) => {
              this.vpcIds = vpcs.sort((a, b) => {
                return a.name.localeCompare(b.name);
              });

              if (this.vpcIds.length === 0) {
                this.form.controls.vpcId.setValue('');
              } else {
                const defaultVpc = this.vpcIds.find(x => x.isDefault);
                if (defaultVpc) {
                  this.form.controls.vpcId.setValue(defaultVpc.vpcId);
                }
              }

              this._loadingVPCs = false;
              this.checkVPCState();
            },
            () => {
              this.clearVpcId();
              this._loadingVPCs = false;
            },
            () => {
              this._loadingVPCs = false;
            });
  }

  checkVPCState(): void {
    if (this.vpcIds.length === 0 && this.form.controls.vpcId.enabled) {
      this.form.controls.vpcId.disable();
    } else if (this.vpcIds.length > 0 && this.form.controls.vpcId.disabled) {
      this.form.controls.vpcId.enable();
    }
  }

  getVPCIdHint(): string {
    return (!this._loadingVPCs && !this._hasRequiredCredentials()) ? 'Please enter your credentials first.' : '';
  }

  getVPCOptionName(vpc: AWSVPC): string {
    return vpc.name !== '' ? vpc.name + ' (' + vpc.vpcId + ')' : vpc.vpcId;
  }

  private _clusterProviderSettingsForm(valid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        aws: {
          accessKeyId: this.form.controls.accessKeyId.value,
          secretAccessKey: this.form.controls.secretAccessKey.value,
          securityGroupID: this.form.controls.securityGroupID.value,
          vpcId: this.form.controls.vpcId.value,
          routeTableId: this.form.controls.routeTableId.value,
          instanceProfileName: this.form.controls.instanceProfileName.value,
          roleARN: this.form.controls.roleARN.value,
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
