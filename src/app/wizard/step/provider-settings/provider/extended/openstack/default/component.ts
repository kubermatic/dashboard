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
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {OpenstackCredentialsTypeService} from '@app/wizard/step/provider-settings/provider/extended/openstack/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import * as _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  SecurityGroup = 'securityGroup',
  Network = 'network',
  SubnetID = 'subnetID',
}

enum SecurityGroupState {
  Ready = 'Security Group',
  Loading = 'Loading...',
  Empty = 'No Security Groups Available',
}

enum NetworkState {
  Ready = 'Network',
  Loading = 'Loading...',
  Empty = 'No Networks Available',
}

enum SubnetIDState {
  Ready = 'Subnet ID',
  Loading = 'Loading...',
  Empty = 'No Subnet IDs Available',
}

@Component({
  selector: 'km-wizard-openstack-provider-extended-default-credentials',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderExtendedDefaultCredentialsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderExtendedDefaultCredentialsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackProviderExtendedDefaultCredentialsComponent
  extends BaseFormValidator
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;
  @ViewChild('securityGroupCombobox')
  private readonly _securityGroupCombobox: FilteredComboboxComponent;
  @ViewChild('subnetIDCombobox')
  private readonly _subnetIDCombobox: FilteredComboboxComponent;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isPresetSelected = false;
  securityGroups: OpenstackSecurityGroup[] = [];
  securityGroupsLabel = SecurityGroupState.Empty;
  networks: OpenstackNetwork[] = [];
  networksLabel = NetworkState.Empty;
  subnetIDs: OpenstackSubnet[] = [];
  subnetIDsLabel = SubnetIDState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _credentialsTypeService: OpenstackCredentialsTypeService
  ) {
    super('Openstack Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.Network]: this._builder.control(''),
      [Controls.SubnetID]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset =>
      Object.values(Controls).forEach(control => {
        this.isPresetSelected = !!preset;
        this._enable(!this.isPresetSelected, control);
      })
    );

    this._credentialsTypeService.credentialsTypeChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset());
  }

  ngAfterViewInit(): void {
    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this._hasRequiredCredentials() ? this._clearSecurityGroup() : null)))
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(switchMap(_ => this._securityGroupListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSecurityGroups.bind(this));

    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this._hasRequiredCredentials() ? this._clearNetwork() : null)))
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(switchMap(_ => this._networkListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadNetworks.bind(this));

    this.form
      .get(Controls.Network)
      .valueChanges.pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this._canLoadSubnet() ? this._clearSubnetID() : null)))
      .pipe(filter(_ => this._canLoadSubnet()))
      .pipe(switchMap(_ => this._subnetIDListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSubnetIDs.bind(this));
  }

  onSecurityGroupChange(securityGroup: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.securityGroups = securityGroup;
  }

  onNetworkChange(network: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.network = network;
  }

  onSubnetIDChange(subnetID: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.subnetID = subnetID;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SecurityGroup:
      case Controls.Network:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.SubnetID:
        return this._canLoadSubnet() ? '' : 'Please enter your credentials and network first.';
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  subnetIDDisplayName(id: string): string {
    const subnetID = this.subnetIDs.find(subnetID => subnetID.id === id);
    return subnetID ? `${subnetID.name} (${subnetID.id})` : '';
  }

  private _loadSecurityGroups(securityGroups: OpenstackSecurityGroup[]): void {
    this.securityGroups = securityGroups;
    this.securityGroupsLabel = !_.isEmpty(this.securityGroups) ? SecurityGroupState.Ready : SecurityGroupState.Empty;
    this._cdr.detectChanges();
  }

  private _loadNetworks(networks: OpenstackNetwork[]): void {
    this.networks = networks.filter(network => !network.external);
    this.networksLabel = !_.isEmpty(this.networks) ? NetworkState.Ready : NetworkState.Empty;
    this._cdr.detectChanges();
  }

  private _loadSubnetIDs(subnetIDs: OpenstackSubnet[]): void {
    this.subnetIDs = subnetIDs;
    this.subnetIDsLabel = !_.isEmpty(this.subnetIDs) ? SubnetIDState.Ready : SubnetIDState.Empty;
    this._cdr.detectChanges();
  }

  private _hasBasicCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.username &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.password
    );
  }

  private _hasTenant(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack &&
      (!!this._clusterSpecService.cluster.spec.cloud.openstack.tenant ||
        !!this._clusterSpecService.cluster.spec.cloud.openstack.tenantID)
    );
  }

  private _hasRequiredCredentials(): boolean {
    return this._hasBasicCredentials() && this._hasTenant();
  }

  private _canLoadSubnet(): boolean {
    return this._hasBasicCredentials() && !!this._clusterSpecService.cluster.spec.cloud.openstack.network;
  }

  private _securityGroupListObservable(): Observable<OpenstackSecurityGroup[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .tenant(this._clusterSpecService.cluster.spec.cloud.openstack.tenant)
      .tenantID(this._clusterSpecService.cluster.spec.cloud.openstack.tenantID)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .securityGroups(this._onSecurityGroupLoading.bind(this))
      .pipe(map(securityGroups => _.sortBy(securityGroups, sg => sg.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearSecurityGroup();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearSecurityGroup(): void {
    this.securityGroups = [];
    this._securityGroupCombobox.reset();
    this.securityGroupsLabel = SecurityGroupState.Empty;
    this._cdr.detectChanges();
  }

  private _onSecurityGroupLoading(): void {
    this._clearSecurityGroup();
    this.securityGroupsLabel = SecurityGroupState.Loading;
    this._cdr.detectChanges();
  }

  private _networkListObservable(): Observable<OpenstackNetwork[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .tenant(this._clusterSpecService.cluster.spec.cloud.openstack.tenant)
      .tenantID(this._clusterSpecService.cluster.spec.cloud.openstack.tenantID)
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
    this._networkCombobox.reset();
    this.networksLabel = NetworkState.Empty;
    this._cdr.detectChanges();
  }

  private _onNetworkLoading(): void {
    this._clearNetwork();
    this.networksLabel = NetworkState.Loading;
    this._cdr.detectChanges();
  }

  private _subnetIDListObservable(): Observable<OpenstackSubnet[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .domain(this._clusterSpecService.cluster.spec.cloud.openstack.domain)
      .username(this._clusterSpecService.cluster.spec.cloud.openstack.username)
      .password(this._clusterSpecService.cluster.spec.cloud.openstack.password)
      .tenant(this._clusterSpecService.cluster.spec.cloud.openstack.tenant)
      .tenantID(this._clusterSpecService.cluster.spec.cloud.openstack.tenantID)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .subnets(this._clusterSpecService.cluster.spec.cloud.openstack.network, this._onSubnetIDLoading.bind(this))
      .pipe(map(subnetIDs => _.sortBy(subnetIDs, s => s.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearSubnetID();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearSubnetID(): void {
    this.subnetIDs = [];
    this._subnetIDCombobox.reset();
    this.subnetIDsLabel = SubnetIDState.Empty;
    this._cdr.detectChanges();
  }

  private _onSubnetIDLoading(): void {
    this._clearSubnetID();
    this.subnetIDsLabel = SubnetIDState.Loading;
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
