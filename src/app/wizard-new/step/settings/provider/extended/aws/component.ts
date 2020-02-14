import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {EMPTY, iif, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {NewWizardService, PresetsService} from '../../../../../../core/services';
import {AWSCloudSpec} from '../../../../../../shared/entity/cloud/AWSCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {AWSVPC} from '../../../../../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {Controls as BasicControls} from '../../basic/aws/component';

enum Controls {
  VPCID = 'vpcId',
  SecurityGroup = 'securityGroup',
  RouteTableID = 'routeTableId',
  InstanceProfileName = 'instanceProfileName',
  RoleARN = 'roleARN',
}

enum VPCState {
  Loading = 'Loading...',
  Ready = 'VPC',
}

@Component({
  selector: 'kubermatic-wizard-aws-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSProviderExtendedComponent), multi: true}
  ]
})
export class AWSProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  vpcIds: AWSVPC[] = [];

  readonly controls = Controls;

  protected readonly _debounceTime = 250;

  private _vpcState = VPCState.Ready;

  get vpcLabel(): string {
    return this._vpcState;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _wizard: NewWizardService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VPCID]: new FormControl('', Validators.pattern('vpc-(\\w{8}|\\w{17})')),
      [Controls.SecurityGroup]: new FormControl('', Validators.pattern('sg-(\\w{8}|\\w{17})')),
      [Controls.RouteTableID]: new FormControl('', Validators.pattern('rtb-(\\w{8}|\\w{17})')),
      [Controls.InstanceProfileName]: new FormControl(''),
      [Controls.RoleARN]: new FormControl(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this._wizard.clusterChanges.pipe(debounceTime(this._debounceTime))
        .pipe(switchMap(_ => iif(() => !this._controlValue(Controls.VPCID), this._vpcListObservable(), EMPTY)))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vpcs: AWSVPC[]) => {
          this.vpcIds = vpcs;
          const defaultVPC = this.vpcIds.find(vpc => vpc.isDefault);
          this.form.get(Controls.VPCID).setValue(defaultVPC ? defaultVPC.vpcId : undefined, {emitEvent: false});
          this._vpcState = VPCState.Ready;
        });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._wizard.cluster = this._getClusterEntity());
  }

  hasError(control: string, errorName: string): boolean {
    return this.form.get(control).hasError(errorName);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _vpcListObservable(): Observable<AWSVPC[]> {
    return this._presets.provider(NodeProvider.AWS)
        .accessKeyID(this._controlValue(BasicControls.AccessKeyID))
        .secretAccessKey(this._controlValue(BasicControls.SecretAccessKey))
        .vpcs(this._wizard.datacenter)
        .pipe(map(vpcs => vpcs.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(tap(_ => this._vpcState = VPCState.Loading))
        .pipe(catchError(() => {
          this._vpcState = VPCState.Ready;
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _controlValue(control: Controls|BasicControls): string {
    return this._wizard.cluster.spec.cloud.aws[control];
  }

  private _getClusterEntity(): ClusterEntity {
    return {
      spec: {
        cloud: {
          aws: {
            instanceProfileName: this.form.get(Controls.InstanceProfileName).value,
            roleARN: this.form.get(Controls.RoleARN).value,
            routeTableId: this.form.get(Controls.RouteTableID).value,
            securityGroupID: this.form.get(Controls.SecurityGroup).value,
            vpcId: this.form.get(Controls.VPCID).value,
          } as AWSCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
