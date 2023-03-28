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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {Cluster} from '@shared/entity/cluster';
import {
  OpenstackNetwork,
  OpenstackSecurityGroup,
  OpenstackSubnet,
  OpenstackSubnetPool,
} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, merge, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {OpenstackCredentialsTypeService} from '../service';
import {IPVersion} from '../shared/types/ip-version';
import {
  IPv4SubnetIDState,
  IPv6SubnetIDState,
  IPv6SubnetPoolState,
  NetworkState,
  SecurityGroupState,
} from '../shared/types/state';

enum Controls {
  SecurityGroup = 'securityGroup',
  Network = 'network',
  IPv4SubnetID = 'ipv4SubnetID',
  IPv6SubnetID = 'ipv6SubnetID',
  IPv6SubnetPool = 'ipv6SubnetPool',
}

@Component({
  selector: 'km-wizard-openstack-provider-extended-app-credentials',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackProviderExtendedAppCredentialsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackProviderExtendedAppCredentialsComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackProviderExtendedAppCredentialsComponent
  extends BaseFormValidator
  implements OnInit, AfterViewInit, OnDestroy
{
  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;
  @ViewChild('securityGroupCombobox')
  private readonly _securityGroupCombobox: FilteredComboboxComponent;
  @ViewChild('ipv4SubnetIDCombobox')
  private readonly _ipv4SubnetIDCombobox: FilteredComboboxComponent;
  @ViewChild('ipv6SubnetIDCombobox')
  private readonly _ipv6SubnetIDCombobox: FilteredComboboxComponent;
  @ViewChild('ipv6SubnetPoolCombobox')
  private readonly _ipv6SubnetPoolCombobox: FilteredComboboxComponent;
  private readonly _debounceTime = 500;
  readonly Controls = Controls;
  isPresetSelected = false;
  securityGroups: OpenstackSecurityGroup[] = [];
  securityGroupsLabel = SecurityGroupState.Empty;
  networks: OpenstackNetwork[] = [];
  networksLabel = NetworkState.Empty;
  ipv4SubnetIDs: OpenstackSubnet[] = [];
  ipv4SubnetIDsLabel = IPv4SubnetIDState.Empty;
  ipv6SubnetIDs: OpenstackSubnet[] = [];
  ipv6SubnetIDsLabel = IPv6SubnetIDState.Empty;
  ipv6SubnetPools: OpenstackSubnetPool[] = [];
  ipv6SubnetPoolsLabel = IPv6SubnetPoolState.Empty;
  isDualStackNetworkSelected: boolean;

  private _applicationCredentialID = '';
  private _applicationCredentialSecret = '';

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
      [Controls.IPv4SubnetID]: this._builder.control(''),
      [Controls.IPv6SubnetID]: this._builder.control(''),
      [Controls.IPv6SubnetPool]: this._builder.control(''),
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

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(map(cluster => Cluster.isDualStackNetworkSelected(cluster)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: isDualStackNetworkSelected => {
          this.isDualStackNetworkSelected = isDualStackNetworkSelected;
          if (!this.isDualStackNetworkSelected) {
            this._ipv6SubnetIDCombobox?.reset();
            this._ipv6SubnetPoolCombobox?.reset();
          }
        },
      });
  }

  ngAfterViewInit(): void {
    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._hasApplicationCredentials()) {
            this._clearCredentials();
          }
        })
      )
      .subscribe(null);

    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this._hasApplicationCredentials() ? this._clearSecurityGroup() : null)))
      .pipe(filter(_ => this._hasApplicationCredentials()))
      .pipe(filter(_ => this._areCredentialsChanged()))
      .pipe(switchMap(_ => this._securityGroupListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSecurityGroups.bind(this));

    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => (!this._hasApplicationCredentials() ? this._clearNetwork() : null)))
      .pipe(filter(_ => this._hasApplicationCredentials()))
      .pipe(filter(_ => this._areCredentialsChanged()))
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

    merge(this._clusterSpecService.clusterChanges, this._credentialsTypeService.credentialsTypeChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.OPENSTACK))
      .pipe(debounceTime(this._debounceTime))
      .pipe(filter(_ => Cluster.isDualStackNetworkSelected(this._clusterSpecService.cluster)))
      .pipe(tap(_ => (!this._hasApplicationCredentials() ? this._clearSubnetPool() : null)))
      .pipe(filter(_ => this._hasApplicationCredentials()))
      .pipe(filter(_ => this._areCredentialsChanged()))
      .pipe(switchMap(_ => this._subnetPoolListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadSubnetPools.bind(this));
  }

  onSecurityGroupChange(securityGroup: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.securityGroups = securityGroup;
  }

  onNetworkChange(network: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.network = network;
  }

  onIPv4SubnetIDChange(subnetID: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.subnetID = subnetID;
  }

  onIPv6SubnetIDChange(subnetID: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.ipv6SubnetID = subnetID;
  }

  onIPv6SubnetPoolChange(subnetPool: string): void {
    this._clusterSpecService.cluster.spec.cloud.openstack.ipv6SubnetPool = subnetPool;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SecurityGroup:
      case Controls.Network:
      case Controls.IPv6SubnetPool:
        return this._hasApplicationCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.IPv4SubnetID:
      case Controls.IPv6SubnetID:
        return this._canLoadSubnet() ? '' : 'Please enter your credentials and network first.';
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ipv4SubnetIDDisplayName(id: string): string {
    const subnetID = this.ipv4SubnetIDs.find(subnetID => subnetID.id === id);
    return subnetID ? `${subnetID.name} (${subnetID.id})` : '';
  }

  ipv6SubnetIDDisplayName(id: string): string {
    const subnetID = this.ipv6SubnetIDs.find(subnetID => subnetID.id === id);
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
    this.ipv4SubnetIDs = subnetIDs.filter(subnetID => subnetID.ipVersion === IPVersion.IPv4);
    this.ipv6SubnetIDs = subnetIDs.filter(subnetID => subnetID.ipVersion === IPVersion.IPv6);
    this.ipv4SubnetIDsLabel = !_.isEmpty(this.ipv4SubnetIDs) ? IPv4SubnetIDState.Ready : IPv4SubnetIDState.Empty;
    this.ipv6SubnetIDsLabel = !_.isEmpty(this.ipv6SubnetIDs) ? IPv6SubnetIDState.Ready : IPv6SubnetIDState.Empty;
    this._cdr.detectChanges();
  }

  private _loadSubnetPools(subnetPools: OpenstackSubnetPool[]): void {
    this.ipv6SubnetPools = subnetPools;
    this.ipv6SubnetPoolsLabel = !_.isEmpty(this.ipv6SubnetPools)
      ? IPv6SubnetPoolState.Ready
      : IPv6SubnetPoolState.Empty;
    this._cdr.detectChanges();
  }

  private _hasApplicationCredentials(): boolean {
    return (
      !!this._clusterSpecService.cluster.spec.cloud.openstack &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID &&
      !!this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret
    );
  }

  private _areCredentialsChanged(): boolean {
    let credentialsChanged = false;

    if (
      this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialID !== this._applicationCredentialID
    ) {
      this._applicationCredentialID = this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID;
      credentialsChanged = true;
    }

    if (
      this._clusterSpecService.cluster.spec.cloud.openstack?.applicationCredentialSecret !==
      this._applicationCredentialSecret
    ) {
      this._applicationCredentialSecret =
        this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  private _clearCredentials(): void {
    this._applicationCredentialID = '';
    this._applicationCredentialSecret = '';
  }

  private _canLoadSubnet(): boolean {
    return this._hasApplicationCredentials() && !!this._clusterSpecService.cluster.spec.cloud.openstack.network;
  }

  private _securityGroupListObservable(): Observable<OpenstackSecurityGroup[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
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
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
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
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
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
    this.ipv4SubnetIDs = [];
    this.ipv6SubnetIDs = [];
    this._ipv4SubnetIDCombobox.reset();
    this._ipv6SubnetIDCombobox?.reset();
    this.ipv4SubnetIDsLabel = IPv4SubnetIDState.Empty;
    this.ipv6SubnetIDsLabel = IPv6SubnetIDState.Empty;
    this._cdr.detectChanges();
  }

  private _onSubnetIDLoading(): void {
    this._clearSubnetID();
    this.ipv4SubnetIDsLabel = IPv4SubnetIDState.Loading;
    this.ipv6SubnetIDsLabel = IPv6SubnetIDState.Loading;
    this._cdr.detectChanges();
  }

  private _subnetPoolListObservable(): Observable<OpenstackSubnetPool[]> {
    return this._presets
      .provider(NodeProvider.OPENSTACK)
      .applicationCredentialID(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialID)
      .applicationCredentialPassword(this._clusterSpecService.cluster.spec.cloud.openstack.applicationCredentialSecret)
      .datacenter(this._clusterSpecService.cluster.spec.cloud.dc)
      .subnetPools(IPVersion.IPv6, this._onSubnetPoolLoading.bind(this))
      .pipe(map(subnetPools => _.sortBy(subnetPools, s => s.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearSubnetPool();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearSubnetPool(): void {
    this.ipv6SubnetPools = [];
    this._ipv6SubnetPoolCombobox?.reset();
    this.ipv6SubnetPoolsLabel = IPv6SubnetPoolState.Empty;
    this._cdr.detectChanges();
  }

  private _onSubnetPoolLoading(): void {
    this._clearSubnetPool();
    this.ipv6SubnetPoolsLabel = IPv6SubnetPoolState.Loading;
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
