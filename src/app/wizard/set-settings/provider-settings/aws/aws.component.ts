import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';
import {debounceTime, take, takeUntil} from 'rxjs/operators';

import {WizardService} from '../../../../core/services';
import {ClusterEntity} from '../../../../shared/entity/ClusterEntity';
import {AWSSubnet, AWSVPC} from '../../../../shared/entity/provider/aws/AWS';
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
  vpcIds: AWSVPC[] = [];

  private _subnetMap: {[type: string]: AWSSubnet[]} = {};
  private _loadingSubnetIds = false;
  private _loadingVPCs = false;
  private _noSubnets = false;
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

    this._loadVPCs();
    this.checkVPCState();
    this._loadSubnetIds();
    this.checkSubnetState();

    this.form.controls.vpcId.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      if (this._isVPCSelectedAndValid()) {
        this._loadSubnetIds();
      } else {
        this.subnetIds = [];
        this._subnetMap = {};
        this.form.controls.subnetId.setValue('');
      }
      this.checkSubnetState();
    });

    this.form.valueChanges.pipe(debounceTime(1000)).pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (this._hasRequiredCredentials() && !this._noSubnets) {
        this._loadVPCs();
      }
      this.checkVPCState();

      if (this._isVPCSelectedAndValid()) {
        this._loadSubnetIds();
      }
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
    } else if (this._loadingSubnetIds && !this._noSubnets) {
      return 'Loading Subnet IDs...';
    } else if (
        this.form.controls.vpcId.value !== '' && this.form.controls.vpcId.valid && this.subnetIds.length === 0 ||
        this._noSubnets) {
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
                return a.name.localeCompare(b.name);
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
                this._noSubnets = true;
              } else {
                this._noSubnets = false;
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
    return (!this._loadingSubnetIds && (!this._hasRequiredCredentials() || !this._isVPCSelectedAndValid())) ?
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

  private _isVPCSelectedAndValid(): boolean {
    return this.form.controls.vpcId.value !== '' && this.form.controls.vpcId.valid;
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
              }

              this._loadingVPCs = false;
              this.checkVPCState();
            },
            () => {
              this.vpcIds = [];
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
