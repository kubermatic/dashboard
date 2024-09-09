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
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {OpenstackCredentialsTypeService} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {OpenstackCredentials} from '@shared/components/openstack-credentials/component';
import {CloudSpec, Cluster, ClusterSpec, OpenstackCloudSpec} from '@shared/entity/cluster';
import {OpenstackFloatingIPPool} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  Domain = 'domain',
  Credentials = 'credentials',
  FloatingIPPool = 'floatingIPPool',
}

enum FloatingIPPoolState {
  Ready = 'Floating IP Pool',
  Loading = 'Loading...',
  Empty = 'No Floating IP Pools Available',
}

@Component({
  selector: 'km-wizard-openstack-provider-basic',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderBasicComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderBasicComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackProviderBasicComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _domains: string[] = ['Default'];
  private _isFloatingPoolIPEnforced = false;
  @ViewChild('floatingIPPoolCombobox')
  private readonly _floatingIPPoolCombobox: FilteredComboboxComponent;
  floatingIPPools: OpenstackFloatingIPPool[] = [];
  floatingIPPoolsLabel = FloatingIPPoolState.Empty;
  readonly Controls = Controls;
  isPresetSelected = false;
  domains = this._domains.map(type => ({name: type}));

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Domain]: this._builder.control('', Validators.required),
      [Controls.Credentials]: this._builder.control(''),
      [Controls.FloatingIPPool]: this._builder.control('', Validators.required),
    });

    this._init();

    this._presets.presetDetailedChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      Object.values(Controls).forEach(control => {
        this._enable(!this.isPresetSelected, control);
      });
      const providerSettings = preset?.providers.find(provider => provider.name === NodeProvider.OPENSTACK);
      if (providerSettings?.isCustomizable) {
        if (providerSettings.openstack?.floatingIPPool) {
          this.form.get(Controls.FloatingIPPool).setValue(providerSettings.openstack.floatingIPPool);
          this.onFloatingIPPoolChange(providerSettings.openstack.floatingIPPool);
        }
        this._enable(true, Controls.FloatingIPPool);
        this.onCredentialsChange(null, preset.name);
      }
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(OpenstackCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.openstack))
      );

    merge(this.form.get(Controls.Domain).valueChanges.pipe(distinctUntilChanged()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    merge(
      this._clusterSpecService.providerChanges,
      this._clusterSpecService.datacenterChanges,
      this._credentialsTypeService.credentialsTypeChanges
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.datacenter).pipe(take(1))))
      .pipe(tap(dc => (this._isFloatingPoolIPEnforced = dc?.spec.openstack.enforceFloatingIP)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isRequired(control: Controls): boolean {
    switch (control) {
      case Controls.FloatingIPPool:
        return this._isFloatingPoolIPEnforced;
      default:
        return true;
    }
  }

  onFloatingIPPoolChange(floatingIPPool: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.floatingIPPool = floatingIPPool;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.FloatingIPPool:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }

    return '';
  }

  onCredentialsChange(credentials?: OpenstackCredentials, preset?: string): void {
    this._clearFloatingIPPool();
    this._floatingIPPoolListObservable(credentials, preset)
      .pipe(take(1))
      .subscribe((floatingIPPools: OpenstackFloatingIPPool[]) => {
        this.floatingIPPools = floatingIPPools;
        this.floatingIPPoolsLabel = !_.isEmpty(this.floatingIPPools)
          ? FloatingIPPoolState.Ready
          : FloatingIPPoolState.Empty;
        this._cdr.detectChanges();
      });
  }

  private _hasRequiredCredentials(): boolean {
    return (
      (!!this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialID &&
        !!this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialSecret) ||
      (!!this._clusterSpecService.cluster.spec.cloud.openstack?.username &&
        !!this._clusterSpecService.cluster.spec.cloud.openstack?.password) ||
      this.isPresetSelected
    );
  }

  private _floatingIPPoolListObservable(
    credentials?: OpenstackCredentials,
    preset?: string
  ): Observable<OpenstackFloatingIPPool[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .credential(preset)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .applicationCredentialID(credentials?.applicationCredentialID)
      .applicationCredentialPassword(credentials?.applicationCredentialSecret)
      .username(credentials?.username)
      .password(credentials?.password)
      .project(credentials?.project)
      .projectID(credentials?.projectID)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .networks(this._onFloatingIPPoolLoading.bind(this))
      .pipe(
        map(networks => {
          const filteredNetworks = networks.filter(network => network.external === true);
          return _.sortBy(filteredNetworks, n => n.name.toLowerCase());
        })
      )
      .pipe(
        catchError(() => {
          this._clearFloatingIPPool();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearFloatingIPPool(): void {
    this.floatingIPPools = [];
    this._floatingIPPoolCombobox.reset();
    this.floatingIPPoolsLabel = FloatingIPPoolState.Empty;
    this._cdr.detectChanges();
  }

  private _onFloatingIPPoolLoading(): void {
    this._clearFloatingIPPool();
    this.floatingIPPoolsLabel = FloatingIPPoolState.Loading;
    this._cdr.detectChanges();
  }

  private _init(): void {
    this._clusterSpecService.cluster = this._getClusterEntity();
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
          openstack: {
            domain: this.form.get(Controls.Domain).value,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
