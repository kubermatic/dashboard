import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {EMPTY, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet} from '../../../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

enum Controls {
  SecurityGroup = 'securityGroup',
  Network = 'network',
  SubnetID = 'subnetID',
}

@Component({
  selector: 'km-wizard-openstack-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OpenstackProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => OpenstackProviderExtendedComponent), multi: true}
  ]
})
export class OpenstackProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  securityGroups: OpenstackSecurityGroup[] = [];
  networks: OpenstackNetwork[] = [];
  subnetIDs: OpenstackSubnet[] = [];

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('Openstack Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.SecurityGroup]: this._builder.control(''),
      [Controls.Network]: this._builder.control(''),
      [Controls.SubnetID]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(
                Object.values(this._clusterService.cluster.spec.cloud.openstack).every(value => !value)));

    this._clusterService.clusterChanges
        .pipe(tap(_ => !this._hasRequiredBasicCredentials() ? this.securityGroups = [] : null))
        .pipe(switchMap(_ => this._securityGroupListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._loadSecurityGroups.bind(this));

    this._clusterService.clusterChanges.pipe(tap(_ => !this._hasRequiredBasicCredentials() ? this.networks = [] : null))
        .pipe(switchMap(_ => this._networkListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._loadNetworks.bind(this));

    this.form.get(Controls.Network)
        .valueChanges.pipe(tap(_ => !this._hasRequiredCredentials() ? this.subnetIDs = [] : null))
        .pipe(switchMap(_ => this._subnetIDListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._loadSubnetIDs.bind(this));
  }

  onSecurityGroupChange(securityGroup: string): void {
    this._clusterService.cluster.spec.cloud.openstack.securityGroups = securityGroup;
  }

  onNetworkChange(network: string): void {
    this._clusterService.cluster.spec.cloud.openstack.network = network;
  }

  onSubnetIDChange(subnetID: string): void {
    this._clusterService.cluster.spec.cloud.openstack.subnetID = subnetID;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.SecurityGroup:
      case Controls.Network:
        return this._hasRequiredBasicCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.SubnetID:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials & network first.';
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
  }

  private _loadNetworks(networks: OpenstackNetwork[]): void {
    this.networks = networks;
  }

  private _loadSubnetIDs(subnetIDs: OpenstackSubnet[]): void {
    this.subnetIDs = subnetIDs;
  }

  private _hasRequiredBasicCredentials(): boolean {
    return !!this._clusterService.cluster.spec.cloud.openstack &&
        !!this._clusterService.cluster.spec.cloud.openstack.username &&
        !!this._clusterService.cluster.spec.cloud.openstack.password &&
        !!this._clusterService.cluster.spec.cloud.openstack.domain &&
        (!!this._clusterService.cluster.spec.cloud.openstack.tenant ||
         !!this._clusterService.cluster.spec.cloud.openstack.tenantID);
  }

  private _hasRequiredCredentials(): boolean {
    return !!this._hasRequiredBasicCredentials && !!this._clusterService.cluster.spec.cloud.openstack &&
        !!this._clusterService.cluster.spec.cloud.openstack.network;
  }

  private _securityGroupListObservable(): Observable<OpenstackSecurityGroup[]> {
    return this._presets.provider(NodeProvider.OPENSTACK)
        .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
        .username(this._clusterService.cluster.spec.cloud.openstack.username)
        .password(this._clusterService.cluster.spec.cloud.openstack.password)
        .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
        .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
        .datacenter(this._clusterService.cluster.spec.cloud.dc)
        .securityGroups()
        .pipe(map(securityGroups => securityGroups.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.SecurityGroup).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _networkListObservable(): Observable<OpenstackNetwork[]> {
    return this._presets.provider(NodeProvider.OPENSTACK)
        .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
        .username(this._clusterService.cluster.spec.cloud.openstack.username)
        .password(this._clusterService.cluster.spec.cloud.openstack.password)
        .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
        .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
        .datacenter(this._clusterService.cluster.spec.cloud.dc)
        .networks()
        .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.Network).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _subnetIDListObservable(): Observable<OpenstackSubnet[]> {
    return this._presets.provider(NodeProvider.OPENSTACK)
        .domain(this._clusterService.cluster.spec.cloud.openstack.domain)
        .username(this._clusterService.cluster.spec.cloud.openstack.username)
        .password(this._clusterService.cluster.spec.cloud.openstack.password)
        .tenant(this._clusterService.cluster.spec.cloud.openstack.tenant)
        .tenantID(this._clusterService.cluster.spec.cloud.openstack.tenantID)
        .datacenter(this._clusterService.cluster.spec.cloud.dc)
        .subnets(this._clusterService.cluster.spec.cloud.openstack.network)
        .pipe(map(subnetIDs => subnetIDs.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.SubnetID).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
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
