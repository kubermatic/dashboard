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

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {Cluster, GCPCloudSpec, IPFamily} from '@shared/entity/cluster';
import {GCPNetwork, GCPSubnetwork} from '@shared/entity/provider/gcp';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Network = 'network',
  SubNetwork = 'subNetwork',
}

enum NetworkState {
  Ready = 'Network',
  Empty = 'No Networks Available',
  Loading = 'Loading...',
}

enum SubNetworkState {
  Ready = 'Subnetwork',
  Empty = 'No Subnetworks Available',
  Loading = 'Loading...',
}

@Component({
  selector: 'km-wizard-gcp-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GCPProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => GCPProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class GCPProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 500;
  private _onNetworkChange = new EventEmitter<void>();
  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;
  @ViewChild('subNetworkCombobox')
  private readonly _subNetworkCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;
  isPresetSelected = false;
  isDualStackNetworkSelected: boolean;
  networks: GCPNetwork[] = [];
  networkLabel = NetworkState.Empty;
  subNetworks: GCPSubnetwork[] = [];
  subNetworkLabel = SubNetworkState.Empty;

  private _preset = '';
  private _serviceAccount = '';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('GCP Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Network]: this._builder.control(''),
      [Controls.SubNetwork]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      this._updateControlsState();
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.GCP))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const gcp = this._clusterSpecService.cluster.spec.cloud.gcp;
        this._presets.enablePresets(this.isDualStackNetworkSelected ? !gcp.serviceAccount : GCPCloudSpec.isEmpty(gcp));
      });

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.GCP))
      .pipe(
        tap(cluster => {
          const isDualStackSelected = Cluster.isDualStackNetworkSelected(cluster);
          if (this.isDualStackNetworkSelected !== isDualStackSelected) {
            this.isDualStackNetworkSelected = isDualStackSelected;
            this._updateControlsState();
            this._clearCredentials();
          }
        })
      )
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._hasRequiredCredentials()) {
            this._clearNetwork();
            this._clearSubNetwork();
            this._clearCredentials();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(filter(cluster => this._areCredentialsChanged(cluster)))
      .pipe(switchMap(_ => this._networkListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadNetworks.bind(this));

    this._onNetworkChange
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(switchMap(_ => this._subnetworkListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSubNetworks.bind(this));
  }

  onNetworkChange(network: string): void {
    this._clusterSpecService.cluster.spec.cloud.gcp.network = network;
    this._clearSubNetwork();
    this._onNetworkChange.emit();
  }

  onSubNetworkChange(subNetwork: string): void {
    this._clusterSpecService.cluster.spec.cloud.gcp.subnetwork = subNetwork;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.Network:
      case Controls.SubNetwork:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _hasRequiredCredentials(): boolean {
    return !!(
      this._clusterSpecService.cluster.spec.cloud.gcp?.serviceAccount ||
      (this.isDualStackNetworkSelected && this._presets.preset)
    );
  }

  private _areCredentialsChanged(cluster: Cluster): boolean {
    let credentialsChanged = false;
    if (this._presets.preset !== this._preset) {
      this._preset = this._presets.preset;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.gcp.serviceAccount !== this._serviceAccount) {
      this._serviceAccount = cluster.spec.cloud.gcp.serviceAccount;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  private _clearCredentials(): void {
    this._preset = '';
    this._serviceAccount = '';
  }

  private _loadNetworks(networks: GCPNetwork[]): void {
    this.networkLabel = !_.isEmpty(networks) ? NetworkState.Ready : NetworkState.Empty;
    this.networks = networks;
    this._cdr.detectChanges();
  }

  private _onNetworkLoading(): void {
    this._clearNetwork();
    this.networkLabel = NetworkState.Loading;
    this._cdr.detectChanges();
  }

  private _networkListObservable(): Observable<GCPNetwork[]> {
    return this._presets
      .provider(NodeProvider.GCP)
      .serviceAccount(this._clusterSpecService.cluster.spec.cloud.gcp.serviceAccount)
      .credential(this._presets.preset)
      .networks(this._onNetworkLoading.bind(this))
      .pipe(map(networks => _.sortBy(networks, n => n.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearNetwork();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearNetwork(): void {
    this.networks = [];
    this.networkLabel = NetworkState.Empty;
    this._networkCombobox.reset();
    this._subNetworkCombobox.reset();
    this._cdr.detectChanges();
  }

  private _subnetworkListObservable(): Observable<GCPSubnetwork[]> {
    return this._presets
      .provider(NodeProvider.GCP)
      .serviceAccount(this._clusterSpecService.cluster.spec.cloud.gcp.serviceAccount)
      .credential(this._presets.preset)
      .network(this._clusterSpecService.cluster.spec.cloud.gcp.network)
      .subnetworks(this._clusterSpecService.datacenter, this._onSubNetworkLoading.bind(this))
      .pipe(map(networks => _.sortBy(networks, n => n.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearSubNetwork();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearSubNetwork(): void {
    this.subNetworks = [];
    this.subNetworkLabel = SubNetworkState.Empty;
    this._subNetworkCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onSubNetworkLoading(): void {
    this._clearSubNetwork();
    this.subNetworkLabel = SubNetworkState.Loading;
    this._cdr.detectChanges();
  }

  private _loadSubNetworks(subNetworks: GCPSubnetwork[]): void {
    this.subNetworks = this.isDualStackNetworkSelected
      ? subNetworks.filter(network => network.ipFamily === IPFamily.DualStack)
      : subNetworks;
    this.subNetworkLabel = !_.isEmpty(this.subNetworks) ? SubNetworkState.Ready : SubNetworkState.Empty;
    this._cdr.detectChanges();
  }

  private _updateControlsState(): void {
    Object.values(Controls).forEach(control => {
      this._enable(!this.isPresetSelected || this.isDualStackNetworkSelected, control);
    });
    this._cdr.detectChanges();
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }
}
