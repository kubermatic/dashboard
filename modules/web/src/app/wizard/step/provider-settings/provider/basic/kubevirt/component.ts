// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {FilteredComboboxComponent} from '@app/shared/components/combobox/component';
import {KubeVirtVPC} from '@app/shared/entity/provider/kubevirt';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, KubeVirtCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, switchMap, takeUntil, tap} from 'rxjs/operators';

export enum Controls {
  Kubeconfig = 'kubeconfig',
  VPC = 'vpc',
}

enum VPCState {
  Loading = 'Loading...',
  Ready = 'VPC',
  Empty = 'No VPCs Available',
}

@Component({
  selector: 'km-wizard-kubevirt-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtProviderBasicComponent),
      multi: true,
    },
  ],
})
export class KubeVirtProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isPresetSelected = false;
  vpcList: KubeVirtVPC[] = [];
  selectedVPC = '';
  vpcLabel = VPCState.Empty;

  @ViewChild('vpcCombobox')
  private readonly _vpcCombobox: FilteredComboboxComponent;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('KubeVirt Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Kubeconfig]: this._builder.control('', Validators.required),
      [Controls.VPC]: this._builder.control(''),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.KUBEVIRT))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(Object.values(Controls).every(control => !this.form.get(control).value))
      );

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls)
        .filter(control => control !== Controls.VPC)
        .forEach(control => {
          this.isPresetSelected = !!preset;
          this._enable(!this.isPresetSelected, control);
        })
    );

    merge(this.form.get(Controls.VPC).valueChanges, this.form.get(Controls.Kubeconfig).valueChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    this.form
      .get(Controls.Kubeconfig)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearVPC()))
      .pipe(switchMap(_ => this._vpcListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultVPC.bind(this));

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.VPC:
        return this._hasRequiredCredentials()
          ? 'When specified, this VPC. will be used for the cluster. If not specified, the default VPC will be used.'
          : 'Please enter your credentials first.';
    }

    return '';
  }

  onVPCChange(vpc: string): void {
    this.selectedVPC = vpc || '';
    this._clusterSpecService.cluster.spec.cloud.kubevirt.vpcName = this.selectedVPC;
  }

  private _vpcListObservable(): Observable<KubeVirtVPC[]> {
    return this._presets
      .provider(NodeProvider.KUBEVIRT)
      .kubeconfig(this.form.get(Controls.Kubeconfig).value)
      .vpcs(this._onVPCLoading.bind(this))
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
    this.vpcList = [];
    this.selectedVPC = '';
    this.vpcLabel = VPCState.Empty;
    this._vpcCombobox.reset();
    this._cdr.detectChanges();
  }

  private _setDefaultVPC(vpcs: KubeVirtVPC[]): void {
    this.vpcList = vpcs;
    this.vpcLabel = !_.isEmpty(this.vpcList) ? VPCState.Ready : VPCState.Empty;
    this._cdr.detectChanges();
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.kubevirt &&
      !!this._clusterSpecService.cluster.spec.cloud.kubevirt.kubeconfig
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

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          kubevirt: {
            kubeconfig: this.form.get(Controls.Kubeconfig).value,
          } as KubeVirtCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
