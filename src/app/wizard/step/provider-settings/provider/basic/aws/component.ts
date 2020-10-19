// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetsService} from '@core/services/wizard/presets.service';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {AWSCloudSpec, CloudSpec, Cluster, ClusterSpec} from '@shared/entity/cluster';
import {AWSVPC} from '@shared/entity/provider/aws';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

export enum Controls {
  AccessKeyID = 'accessKeyID',
  AccessKeySecret = 'accessKeySecret',
  VPCID = 'vpcId',
}

enum VPCState {
  Loading = 'Loading...',
  Ready = 'VPC',
  Empty = 'No VPCs Available',
}

@Component({
  selector: 'km-wizard-aws-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AWSProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AWSProviderBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AWSProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 250;

  readonly Controls = Controls;

  vpcIds: AWSVPC[] = [];
  selectedVPC = '';
  vpcLabel = VPCState.Empty;

  @ViewChild('vpcCombobox')
  private readonly _vpcCombobox: FilteredComboboxComponent;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('AWS Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKeyID]: this._builder.control('', Validators.required),
      [Controls.AccessKeySecret]: this._builder.control('', Validators.required),
      [Controls.VPCID]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.AWS))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(Object.values(this._clusterService.cluster.spec.cloud.aws).every(value => !value))
      );

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(this.form.get(Controls.AccessKeyID).valueChanges, this.form.get(Controls.AccessKeySecret).valueChanges)
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearVPC()))
      .pipe(switchMap(_ => this._vpcListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultVPC.bind(this));

    this.form
      .get(Controls.VPCID)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .pipe(distinctUntilChanged())
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.VPCID:
        return this._hasRequiredCredentials()
          ? 'When specified, all worker nodes will be attached to this VPC. If not specified, the default VPC will be used.'
          : 'Please enter your credentials first.';
    }

    return '';
  }

  onVPCChange(vpcId: string): void {
    this._clusterService.cluster.spec.cloud.aws.vpcId = vpcId;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.aws &&
      !!this._clusterService.cluster.spec.cloud.aws.accessKeyId &&
      !!this._clusterService.cluster.spec.cloud.aws.secretAccessKey
    );
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
    return this._presets
      .provider(NodeProvider.AWS)
      .accessKeyID(this.form.get(Controls.AccessKeyID).value)
      .secretAccessKey(this.form.get(Controls.AccessKeySecret).value)
      .vpcs(this._clusterService.datacenter, this._onVPCLoading.bind(this))
      .pipe(map(vpcs => _.sortBy(vpcs, v => v.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearVPC();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _onVPCLoading(): void {
    this._clearVPC();
    this.vpcLabel = VPCState.Loading;
    this._cdr.detectChanges();
  }

  private _clearVPC(): void {
    this.vpcIds = [];
    this.selectedVPC = '';
    this.vpcLabel = VPCState.Empty;
    this._vpcCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultVPC(vpcs: AWSVPC[]): void {
    this.vpcIds = vpcs;
    const defaultVPC = this.vpcIds.find(vpc => vpc.isDefault);
    this.selectedVPC = defaultVPC ? defaultVPC.vpcId : undefined;
    this.vpcLabel = !_.isEmpty(this.vpcIds) ? VPCState.Ready : VPCState.Empty;
    this._cdr.detectChanges();
  }

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          aws: {
            accessKeyId: this.form.get(Controls.AccessKeyID).value,
            secretAccessKey: this.form.get(Controls.AccessKeySecret).value,
          } as AWSCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
