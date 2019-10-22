import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../../core/services';
import {ClusterEntity} from '../../../../../shared/entity/ClusterEntity';
import {AWSVPC} from '../../../../../shared/entity/provider/aws/AWS';
import {ClusterProviderSettingsForm} from '../../../../../shared/model/ClusterForm';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';

@Component({
  selector: 'kubermatic-aws-provider-options',
  templateUrl: './aws-provider-options.component.html',
})
export class AWSProviderOptionsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;

  hideOptional = true;
  form: FormGroup;
  vpcIds: AWSVPC[] = [];

  private _loadingVPCs = false;
  private _selectedPreset: string;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizardService: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      securityGroupID:
          new FormControl(this.cluster.spec.cloud.aws.securityGroupID, Validators.pattern('sg-(\\w{8}|\\w{17})')),
      routeTableId:
          new FormControl(this.cluster.spec.cloud.aws.routeTableId, Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      instanceProfileName: new FormControl(this.cluster.spec.cloud.aws.instanceProfileName),
      roleARN: new FormControl(this.cluster.spec.cloud.aws.roleARN),
      vpcId: new FormControl(this.cluster.spec.cloud.aws.vpcId, Validators.pattern('vpc-(\\w{8}|\\w{17})')),
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this._wizardService.changeClusterProviderSettings(
          this._clusterProviderSettingsForm(this._hasRequiredCredentials()));
    });

    this._wizardService.clusterSettingsFormViewChanged$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      this.hideOptional = data.hideOptional;
    });

    this._wizardService.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.cloudSpec.aws.accessKeyId !== this.cluster.spec.cloud.aws.accessKeyId ||
          data.cloudSpec.aws.secretAccessKey !== this.cluster.spec.cloud.aws.secretAccessKey ||
          data.cloudSpec.aws.vpcId === '') {
        this.cluster.spec.cloud.aws = data.cloudSpec.aws;
        if (this._hasRequiredCredentials()) {
          this._loadVPCs();
          this.checkVPCState();
        } else {
          this.clearVpcId();
        }
      } else if (data.cloudSpec.aws.accessKeyId === '' || data.cloudSpec.aws.secretAccessKey === '') {
        this.clearVpcId();
      }
      this.cluster.spec.cloud.aws = data.cloudSpec.aws;
    });

    this._wizardService.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(newCredentials => {
      if (newCredentials) {
        this._selectedPreset = newCredentials;
        this.form.disable();
        return;
      }

      this.form.enable();
    });
  }

  private _hasRequiredCredentials(): boolean {
    return (this.cluster.spec.cloud.aws.accessKeyId !== '' && this.cluster.spec.cloud.aws.secretAccessKey !== '') ||
        !!this._selectedPreset;
  }

  clearVpcId(): void {
    this.vpcIds = [];
    this.form.controls.vpcId.setValue('');
    this.checkVPCState();
  }

  getVPCFormState(): string {
    if (!this._loadingVPCs && !this._hasRequiredCredentials()) {
      return 'VPC ID';
    } else if (this._loadingVPCs && !this._selectedPreset) {
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
    this._wizardService.provider(NodeProvider.AWS)
        .accessKeyID(this.cluster.spec.cloud.aws.accessKeyId)
        .secretAccessKey(this.cluster.spec.cloud.aws.secretAccessKey)
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

  private _clusterProviderSettingsForm(isValid: boolean): ClusterProviderSettingsForm {
    return {
      cloudSpec: {
        aws: {
          accessKeyId: this.cluster.spec.cloud.aws.accessKeyId,
          secretAccessKey: this.cluster.spec.cloud.aws.secretAccessKey,
          vpcId: this.form.controls.vpcId.value,
          securityGroupID: this.form.controls.securityGroupID.value,
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
