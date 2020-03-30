import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {PresetsService} from '../../../../../../core/services';
import {AWSCloudSpec} from '../../../../../../shared/entity/cloud/AWSCloudSpec';
import {CloudSpec, ClusterEntity, ClusterSpec} from '../../../../../../shared/entity/ClusterEntity';
import {AWSVPC} from '../../../../../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

export enum Controls {
  AccessKeyID = 'accessKeyId',
  SecretAccessKey = 'secretAccessKey',
  VPCID = 'vpcId',
}

enum VPCState {
  Loading = 'Loading...',
  Ready = 'VPC',
}

@Component({
  selector: 'kubermatic-wizard-aws-provider-basic',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AWSProviderBasicComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => AWSProviderBasicComponent), multi: true}
  ]
})
export class AWSProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  vpcIds: AWSVPC[] = [];

  readonly controls = Controls;

  protected readonly _debounceTime = 250;

  private _vpcState = VPCState.Ready;

  get vpcLabel(): string {
    return this._vpcState;
  }

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('AWS Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: new FormControl('', Validators.required),
      [Controls.SecretAccessKey]: new FormControl('', Validators.required),
      [Controls.VPCID]: new FormControl('', [Validators.required, Validators.pattern('vpc-(\\w{8}|\\w{17})')]),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(Object.values(Controls).every(control => !this._controlValue(control))));

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    merge(this.form.get(Controls.AccessKeyID).valueChanges, this.form.get(Controls.SecretAccessKey).valueChanges)
        .pipe(debounceTime(this._debounceTime))
        .pipe(distinctUntilChanged())
        .pipe(switchMap(_ => this._vpcListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((vpcs: AWSVPC[]) => {
          this.vpcIds = vpcs;
          const defaultVPC = this.vpcIds.find(vpc => vpc.isDefault);
          this.form.get(Controls.VPCID).setValue(defaultVPC ? defaultVPC.vpcId : undefined);
          this._vpcState = VPCState.Ready;

          this._clusterService.cluster = this._getClusterEntity();
        });

    this.form.get(Controls.VPCID)
        .valueChanges.pipe(takeUntil(this._unsubscribe))
        .pipe(distinctUntilChanged())
        .subscribe(_ => this._clusterService.cluster = this._getClusterEntity());

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this.form.reset());
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
        .accessKeyID(this._controlValue(Controls.AccessKeyID))
        .secretAccessKey(this._controlValue(Controls.SecretAccessKey))
        .vpcs(this._clusterService.datacenter)
        .pipe(map(vpcs => vpcs.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(tap(_ => this._vpcState = VPCState.Loading))
        .pipe(catchError(() => {
          this._vpcState = VPCState.Ready;
          this.form.get(Controls.VPCID).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _controlValue(control: Controls): string {
    return this.form.get(control).value;
  }

  private _getClusterEntity(): ClusterEntity {
    return {
      spec: {
        cloud: {
          aws: {
            accessKeyId: this.form.get(Controls.AccessKeyID).value,
            secretAccessKey: this.form.get(Controls.SecretAccessKey).value,
            vpcId: this.form.get(Controls.VPCID).value,
          } as AWSCloudSpec
        } as CloudSpec
      } as ClusterSpec
    } as ClusterEntity;
  }
}
