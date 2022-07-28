// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {ComboboxControls} from '@shared/components/combobox/component';
import {
  CloudSpec,
  Cluster,
  ClusterSpec,
  KubeVirtCloudSpec,
  KubeVirtPreAllocatedDataVolume,
} from '@shared/entity/cluster';
import {KubeVirtStorageClass} from '@shared/entity/provider/kubevirt';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {merge, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  PreAllocatedDataVolumes = 'preAllocatedDataVolumes',
  PreAllocatedDataVolumeName = 'preAllocatedDataVolumeName',
  PreAllocatedDataVolumeSize = 'preAllocatedDataVolumeSize',
  PreAllocatedDataVolumeStorageClass = 'preAllocatedDataVolumeStorageClass',
  PreAllocatedDataVolumeUrl = 'preAllocatedDataVolumeUrl',
}

enum StorageClassState {
  Ready = 'Storage Class',
  Loading = 'Loading...',
  Empty = 'No Storage Classes Available',
}

@Component({
  selector: 'km-wizard-kubevirt-provider-extended',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KubeVirtProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  private readonly _defaultPreAllocatedDataVolumeSize = 10;
  readonly Controls = Controls;

  storageClasses: KubeVirtStorageClass[] = [];
  storageClassLabel = StorageClassState.Empty;
  private _preset: string;
  private _kubeconfig: string;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _presetsService: PresetsService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('KubeVirt Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.PreAllocatedDataVolumes]: this._builder.array([]),
    });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.KUBEVIRT))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.KUBEVIRT))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._hasRequiredCredentials()) {
            this._clearStorageClass();
            this._clearCredentials();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(filter(cluster => this._areCredentialsChanged(cluster)))
      .pipe(switchMap(_ => this._storageClassListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadStorageClasses.bind(this));

    this.form.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getCluster()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get preAllocatedDataVolumesFormArray(): FormArray {
    return this.form.get(Controls.PreAllocatedDataVolumes) as FormArray;
  }

  addPreAllocatedDataVolume(): void {
    this.preAllocatedDataVolumesFormArray.push(
      this._builder.group({
        [Controls.PreAllocatedDataVolumeName]: this._builder.control('', Validators.required),
        [Controls.PreAllocatedDataVolumeSize]: this._builder.control(
          this._defaultPreAllocatedDataVolumeSize,
          Validators.required
        ),
        [Controls.PreAllocatedDataVolumeStorageClass]: this._builder.control('', Validators.required),
        [Controls.PreAllocatedDataVolumeUrl]: this._builder.control('', Validators.required),
      })
    );
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.PreAllocatedDataVolumeStorageClass:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      default:
        return '';
    }
  }

  private _storageClassListObservable(): Observable<KubeVirtStorageClass[]> {
    return this._presetsService
      .provider(NodeProvider.KUBEVIRT)
      .kubeconfig(this._clusterSpecService.cluster.spec.cloud.kubevirt.kubeconfig)
      .credential(this._presetsService.preset)
      .storageClass(this._onStorageClassLoading.bind(this))
      .pipe(map(storageClasses => _.sortBy(storageClasses, p => p.name.toLowerCase())))
      .pipe(
        catchError(_ => {
          this._clearStorageClass();
          return onErrorResumeNext(of([]));
        })
      );
  }

  private _onStorageClassLoading(): void {
    this._clearStorageClass();
    this.storageClassLabel = StorageClassState.Loading;
    this._cdr.detectChanges();
  }

  private _loadStorageClasses(storageClasses: KubeVirtStorageClass[]): void {
    this.storageClasses = storageClasses;
    this.storageClassLabel = !_.isEmpty(storageClasses) ? StorageClassState.Ready : StorageClassState.Empty;
    this._cdr.detectChanges();
  }

  private _clearStorageClass(): void {
    this.storageClasses = [];
    this.storageClassLabel = StorageClassState.Empty;
    this._cdr.detectChanges();
  }

  private _hasRequiredCredentials(): boolean {
    return !!(this._presetsService.preset || this._clusterSpecService.cluster.spec.cloud.kubevirt.kubeconfig);
  }

  private _areCredentialsChanged(cluster: Cluster): boolean {
    let credentialsChanged = false;
    if (this._presetsService.preset !== this._preset) {
      this._preset = this._presetsService.preset;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.kubevirt.kubeconfig !== this._kubeconfig) {
      this._kubeconfig = cluster.spec.cloud.kubevirt.kubeconfig;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  private _clearCredentials(): void {
    this._preset = '';
    this._kubeconfig = '';
  }

  private _getCluster(): Cluster {
    const preAllocatedDataVolumes = this._preAllocatedDataVolumes;
    return {
      spec: {
        cloud: {
          kubevirt: {
            preAllocatedDataVolumes: preAllocatedDataVolumes.length ? preAllocatedDataVolumes : null,
          } as KubeVirtCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }

  private get _preAllocatedDataVolumes(): KubeVirtPreAllocatedDataVolume[] {
    return this.preAllocatedDataVolumesFormArray.controls.map(perAllocatedDataVolumeFormGroup => {
      return {
        name: perAllocatedDataVolumeFormGroup.get(Controls.PreAllocatedDataVolumeName).value,
        size: `${+perAllocatedDataVolumeFormGroup.get(Controls.PreAllocatedDataVolumeSize).value}Gi`,
        storageClass: perAllocatedDataVolumeFormGroup.get(Controls.PreAllocatedDataVolumeStorageClass).value[
          ComboboxControls.Select
        ],
        url: perAllocatedDataVolumeFormGroup.get(Controls.PreAllocatedDataVolumeUrl).value,
      };
    });
  }
}
