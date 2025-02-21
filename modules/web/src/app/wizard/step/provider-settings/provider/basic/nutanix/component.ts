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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {CloudSpec, Cluster, ClusterSpec, NutanixCloudSpec} from '@shared/entity/cluster';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {NutanixCluster, NutanixProject} from '@shared/entity/provider/nutanix';
import _ from 'lodash';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';

export enum Controls {
  Username = 'username',
  Password = 'password',
  ProxyURL = 'proxyURL',
  ClusterName = 'clusterName',
  PrismElementUsername = 'prismElementUsername',
  PrismElementPassword = 'prismElementPassword',
  PrismElementEndpoint = 'prismElementEndpoint',
  PrismElementPort = 'prismElementPort',
}

enum ClusterState {
  Ready = 'Cluster',
  Empty = 'No clusters available',
  Loading = 'Loading...',
}

@Component({
    selector: 'km-wizard-nutanix-provider-basic',
    templateUrl: './template.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NutanixProviderBasicComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => NutanixProviderBasicComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class NutanixProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  @ViewChild('clusterCombobox')
  private readonly _clusterCombobox: FilteredComboboxComponent;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  clusters: NutanixCluster[] = [];
  clusterLabel = ClusterState.Empty;
  isPresetSelected = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('Nutanix Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.ProxyURL]: this._builder.control(''),
      [Controls.ClusterName]: this._builder.control('', Validators.required),
      [Controls.PrismElementUsername]: this._builder.control('', Validators.required),
      [Controls.PrismElementPassword]: this._builder.control('', Validators.required),
      [Controls.PrismElementEndpoint]: this._builder.control('', Validators.required),
      [Controls.PrismElementPort]: this._builder.control(undefined),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.NUTANIX))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() =>
        this._presets.enablePresets(NutanixCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.nutanix))
      );

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    merge(
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges,
      this.form.get(Controls.ProxyURL).valueChanges,
      this.form.get(Controls.PrismElementUsername).valueChanges,
      this.form.get(Controls.PrismElementPassword).valueChanges,
      this.form.get(Controls.PrismElementEndpoint).valueChanges,
      this.form.get(Controls.PrismElementPort).valueChanges
    )
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges,
      this.form.get(Controls.ProxyURL).valueChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearCluster()))
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(switchMap(_ => this._clusterListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadClusters.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.ClusterName:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      default:
        return '';
    }
  }

  onClusterChange(clusterName: string): void {
    this._clusterSpecService.cluster.spec.cloud.nutanix.clusterName = clusterName;
    this._clusterSpecService.clusterChanges.next(this._clusterSpecService.cluster);
  }

  private _onClusterLoading(): void {
    this._clearCluster();
    this.clusterLabel = ClusterState.Loading;
    this._cdr.detectChanges();
  }

  private _clusterListObservable(): Observable<NutanixProject[]> {
    return this._presets
      .provider(NodeProvider.NUTANIX)
      .username(this._clusterSpecService.cluster.spec.cloud.nutanix.username)
      .password(this._clusterSpecService.cluster.spec.cloud.nutanix.password)
      .proxyURL(this._clusterSpecService.cluster.spec.cloud.nutanix.proxyURL)
      .clusters(this._clusterSpecService.cluster.spec.cloud.dc, this._onClusterLoading.bind(this))
      .pipe(map(projects => _.sortBy(projects, p => p.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearCluster();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _loadClusters(projects: NutanixProject[]): void {
    this.clusterLabel = !_.isEmpty(projects) ? ClusterState.Ready : ClusterState.Empty;
    this.clusters = projects;
    this._cdr.detectChanges();
  }

  private _clearCluster(): void {
    this.clusters = [];
    this.clusterLabel = ClusterState.Empty;
    this._clusterCombobox.reset();
    this._cdr.detectChanges();
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.nutanix.username &&
      !!this._clusterSpecService.cluster.spec.cloud.nutanix.password
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
          nutanix: {
            username: this.form.get(Controls.Username).value,
            password: this.form.get(Controls.Password).value,
            proxyURL: this.form.get(Controls.ProxyURL).value,
            csi: {
              username: this.form.get(Controls.PrismElementUsername).value,
              password: this.form.get(Controls.PrismElementPassword).value,
              endpoint: this.form.get(Controls.PrismElementEndpoint).value,
              port: this.form.get(Controls.PrismElementPort).value,
            },
          } as NutanixCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
