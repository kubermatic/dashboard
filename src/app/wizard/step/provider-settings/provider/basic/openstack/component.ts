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
import {DatacenterService} from '@core/services/datacenter/service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {CloudSpec, Cluster, ClusterSpec, OpenstackCloudSpec} from '@shared/entity/cluster';
import {OpenstackFloatingIpPool, OpenstackTenant} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  take,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';

enum Controls {
  Domain = 'domain',
  Username = 'username',
  Password = 'password',
  Project = 'project',
  ProjectID = 'projectID',
  FloatingIPPool = 'floatingIPPool',
}

enum FloatingIPPoolState {
  Ready = 'Floating IP Pool',
  Loading = 'Loading...',
  Empty = 'No Floating IP Pools Available',
}

enum ProjectState {
  Ready = 'Project',
  Loading = 'Loading...',
  Empty = 'No Projects Available',
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
  private readonly _debounceTime = 250;
  private readonly _domains: string[] = ['Default'];

  private _isFloatingPoolIPEnforced = false;

  @ViewChild('floatingIPPoolCombobox')
  private readonly _floatingIPPoolCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;

  domains = this._domains.map(type => ({name: type}));
  projects: OpenstackTenant[] = [];
  projectsLabel = ProjectState.Empty;
  floatingIPPools: OpenstackFloatingIpPool[] = [];
  floatingIPPoolsLabel = FloatingIPPoolState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('Openstack Provider Basic');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Domain]: this._builder.control('', Validators.required),
      [Controls.Username]: this._builder.control('', Validators.required),
      [Controls.Password]: this._builder.control('', Validators.required),
      [Controls.Project]: this._builder.control('', Validators.required),
      [Controls.ProjectID]: this._builder.control('', Validators.required),
      [Controls.FloatingIPPool]: this._builder.control('', Validators.required),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(
          Object.values(this._clusterService.cluster.spec.cloud.openstack).every(value => !value)
        )
      );

    merge(this._clusterService.providerChanges, this._clusterService.datacenterChanges)
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.OPENSTACK))
      .pipe(switchMap(_ => this._datacenterService.getDatacenter(this._clusterService.datacenter).pipe(take(1))))
      .pipe(tap(dc => (this._isFloatingPoolIPEnforced = dc.spec.openstack.enforce_floating_ip)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());

    merge(
      this.form.get(Controls.Domain).valueChanges,
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges,
      this.form.get(Controls.Project).valueChanges,
      this.form.get(Controls.ProjectID).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getClusterEntity()));

    merge(
      this.form.get(Controls.Domain).valueChanges,
      this.form.get(Controls.Username).valueChanges,
      this.form.get(Controls.Password).valueChanges
    )
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearProject()))
      .pipe(switchMap(_ => this._projectListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((projects: OpenstackTenant[]) => {
        this.projects = projects;

        if (!_.isEmpty(this.projects)) {
          this.projectsLabel = ProjectState.Ready;
          this._cdr.detectChanges();
        }
      });

    merge(this.form.get(Controls.Project).valueChanges, this.form.get(Controls.ProjectID).valueChanges)
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

    this.form
      .get(Controls.Project)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        value ? this.form.get(Controls.ProjectID).disable() : this.form.get(Controls.ProjectID).enable();
      });

    this.form
      .get(Controls.ProjectID)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        value ? this.form.get(Controls.Project).disable() : this.form.get(Controls.Project).enable();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onFloatingIPPoolChange(floatingIPPool: string): void {
    this._clusterService.cluster.spec.cloud.openstack.floatingIpPool = floatingIPPool;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.Project:
        return this._hasRequiredBasicCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.FloatingIPPool:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first & project/project ID.';
    }

    return '';
  }

  isRequired(control: Controls): boolean {
    switch (control) {
      case Controls.Project:
        return !this.form.get(Controls.ProjectID).value;
      case Controls.ProjectID:
        return !this.form.get(Controls.Project).value;
      case Controls.FloatingIPPool:
        return this._isFloatingPoolIPEnforced;
      default:
        return true;
    }
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _hasRequiredBasicCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.openstack &&
      !!this._clusterService.cluster.spec.cloud.openstack.domain &&
      !!this._clusterService.cluster.spec.cloud.openstack.username &&
      !!this._clusterService.cluster.spec.cloud.openstack.password
    );
  }

  private _hasRequiredCredentials(): boolean {
    return (
      this._hasRequiredBasicCredentials() &&
      (!!this._clusterService.cluster.spec.cloud.openstack.tenant ||
        !!this._clusterService.cluster.spec.cloud.openstack.tenantID)
    );
  }

  private _projectListObservable(): Observable<OpenstackTenant[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .domain(this.form.get(Controls.Domain).value)
      .username(this.form.get(Controls.Username).value)
      .password(this.form.get(Controls.Password).value)
      .datacenter(this._clusterService.cluster.spec.cloud.dc)
      .tenants(this._onProjectLoading.bind(this))
      .pipe(map(projects => _.sortBy(projects, p => p.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearProject();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearProject(): void {
    this.projects = [];
    this.form.get(Controls.Project).setValue('');
    this.form.get(Controls.ProjectID).setValue('');
    this.projectsLabel = ProjectState.Empty;
    this._cdr.detectChanges();
  }

  private _onProjectLoading(): void {
    this._clearProject();
    this.projectsLabel = ProjectState.Loading;
    this._cdr.detectChanges();
  }

  private _floatingIPPoolListObservable(): Observable<OpenstackFloatingIpPool[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .domain(this.form.get(Controls.Domain).value)
      .username(this.form.get(Controls.Username).value)
      .password(this.form.get(Controls.Password).value)
      .tenant(this.form.get(Controls.Project).value)
      .tenantID(this.form.get(Controls.ProjectID).value)
      .datacenter(this._clusterService.cluster.spec.cloud.dc)
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
            domain: this.form.get(Controls.Domain).value,
            username: this.form.get(Controls.Username).value,
            password: this.form.get(Controls.Password).value,
            tenant: this.form.get(Controls.Project).value,
            tenantID: this.form.get(Controls.ProjectID).value,
          } as OpenstackCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
