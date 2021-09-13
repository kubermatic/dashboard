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
import {OpenstackCredentialsTypeService} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {CloudSpec, Cluster, ClusterSpec, OpenstackCloudSpec} from '@shared/entity/cluster';
import {OpenstackFloatingIpPool} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';

enum Controls {
  ApplicationCredentialID = 'applicationCredentialID',
  ApplicationCredentialSecret = 'applicationCredentialSecret',
  FloatingIPPool = 'floatingIPPool',
}

enum FloatingIPPoolState {
  Ready = 'Floating IP Pool',
  Loading = 'Loading...',
  Empty = 'No Floating IP Pools Available',
}

@Component({
  selector: 'km-wizard-openstack-provider-basic-app-credentials',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderBasicAppCredentialsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderBasicAppCredentialsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackProviderBasicAppCredentialsComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 250;
  private _isFloatingPoolIPEnforced = false;
  @ViewChild('floatingIPPoolCombobox')
  private readonly _floatingIPPoolCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;
  isPresetSelected = false;
  floatingIPPools: OpenstackFloatingIpPool[] = [];
  floatingIPPoolsLabel = FloatingIPPoolState.Empty;

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
      [Controls.ApplicationCredentialID]: this._builder.control('', Validators.required),
      [Controls.ApplicationCredentialSecret]: this._builder.control('', Validators.required),
      [Controls.FloatingIPPool]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    this.form.valueChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(
          Object.values(this._clusterSpecService.cluster.spec.cloud.openstack).every(value => !value)
        )
      );

    merge(
      this.form.get(Controls.ApplicationCredentialID).valueChanges.pipe(distinctUntilChanged()),
      this.form.get(Controls.ApplicationCredentialSecret).valueChanges.pipe(distinctUntilChanged())
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    merge(
      this.form.get(Controls.ApplicationCredentialID).valueChanges.pipe(distinctUntilChanged()),
      this.form.get(Controls.ApplicationCredentialSecret).valueChanges.pipe(distinctUntilChanged())
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearFloatingIPPool()))
      .pipe(switchMap(_ => this._floatingIPPoolListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((floatingIPPools: OpenstackFloatingIpPool[]) => {
        this.floatingIPPools = floatingIPPools;

        if (!_.isEmpty(this.floatingIPPools)) {
          this.floatingIPPoolsLabel = FloatingIPPoolState.Ready;
          this._cdr.detectChanges();
        }
      });

    merge(
      this._clusterSpecService.providerChanges,
      this._clusterSpecService.datacenterChanges,
      this._credentialsTypeService.credentialsTypeChanges
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterSpecService.datacenter).pipe(take(1))))
      .pipe(tap(dc => (this._isFloatingPoolIPEnforced = dc.spec.openstack.enforce_floating_ip)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    this.form.reset();
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
    this._clusterSpecService.cluster.spec.cloud.openstack.floatingIpPool = floatingIPPool;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.FloatingIPPool:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }

    return '';
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret
    );
  }

  private _floatingIPPoolListObservable(): Observable<OpenstackFloatingIpPool[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .applicationCredentialID(this.form.get(Controls.ApplicationCredentialID).value)
      .applicationCredentialPassword(this.form.get(Controls.ApplicationCredentialSecret).value)
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

  private _getClusterEntity(): Cluster {
    return {
      spec: {
        cloud: {
          openstack: {
            applicationCredentialID: this.form.get(Controls.ApplicationCredentialID).value,
            applicationCredentialSecret: this.form.get(Controls.ApplicationCredentialSecret).value,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
