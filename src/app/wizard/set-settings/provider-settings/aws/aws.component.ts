import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {AWSSubnet} from '../../../../shared/entity/provider/aws/AWS';
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
  subnetIds: AWSSubnet[] = [];

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  private _loadingSubnetIds = false;
  private _formHelper: FormHelper;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _wizard: WizardService) {}

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

    this._loadSubnetIds();
    this.checkSubnetState();

    this.form.controls.vpcId.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      if (this._isVPCSelected()) {
        this._loadSubnetIds();
        this.checkSubnetState();
      } else {
        this.subnetIds = [];
        this._subnetMap = {};
        this.form.controls.subnetId.setValue('');
      }
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._loadSubnetIds();
      this.checkSubnetState();
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

  getSubnetIDFormState(): string {
    if (!this._loadingSubnetIds && (!this._hasRequiredCredentials() || this.form.controls.vpcId.value === '')) {
      return 'Subnet ID';
    } else if (this._loadingSubnetIds) {
      return 'Loading Subnet IDs...';
    } else if (this.form.controls.vpcId.value !== '' && this.subnetIds.length === 0) {
      return 'No Subnet IDs available';
    } else {
      return 'Subnet ID';
    }
  }

  private _loadSubnetIds(): void {
    if (!this._hasRequiredCredentials() || this.form.controls.vpcId.value === '') {
      return;
    }

    this._loadingSubnetIds = true;
    this._wizard.provider(NodeProvider.AWS)
        .accessKeyID(this.form.controls.accessKeyId.value)
        .secretAccessKey(this.form.controls.secretAccessKey.value)
        .vpc(this.form.controls.vpcId.value)
        .subnets(this.cluster.spec.cloud.dc)
        .pipe(take(1))
        .subscribe(
            (subnets) => {
              this.subnetIds = subnets.sort((a, b) => {
                return (a.name < b.name ? -1 : 1) * ('asc' ? 1 : -1);
              });

              this._subnetMap = {};
              this.subnetIds.forEach(subnet => {
                const find = this.subnetAZ.find(x => x === subnet.availability_zone);
                if (!find) {
                  this._subnetMap[subnet.availability_zone] = [];
                }
                this._subnetMap[subnet.availability_zone].push(subnet);
              });

              if (this.subnetIds.length === 0) {
                this.form.controls.subnetId.setValue('');
              }

              this._loadingSubnetIds = false;
              this.checkSubnetState();
            },
            () => {
              this._loadingSubnetIds = false;
            });
  }

  checkSubnetState(): void {
    if (this.subnetIds.length === 0 && this.form.controls.subnetId.enabled) {
      this.form.controls.subnetId.disable();
    } else if (this.subnetIds.length > 0 && this.form.controls.subnetId.disabled) {
      this.form.controls.subnetId.enable();
    }
  }

  getSubnetIDHint(): string {
    return (!this._loadingSubnetIds && (!this._hasRequiredCredentials() || this.form.controls.vpcId.value === '')) ?
        'Please enter your credentials first.' :
        '';
  }

  get subnetAZ(): string[] {
    return Object.keys(this._subnetMap);
  }

  getSubnetToAZ(az: string): AWSSubnet[] {
    return this._subnetMap[az];
  }

  getSubnetOptionName(subnet: AWSSubnet): string {
    return subnet.name !== '' ? subnet.name + ' (' + subnet.id + ')' : subnet.id;
  }

  private _hasRequiredCredentials(): boolean {
    return !(this.form.controls.accessKeyId.value === '' || this.form.controls.secretAccessKey.value === '');
  }

  private _isVPCSelected(): boolean {
    return this.form.controls.vpcId.value.toString().length > 0;
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
