import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {EMPTY, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {GCPNetwork, GCPSubnetwork} from '../../../../../../shared/entity/provider/gcp/GCP';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';

enum Controls {
  Network = 'network',
  SubNetwork = 'subNetwork',
}

@Component({
  selector: 'km-wizard-gcp-provider-extended',
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => GCPProviderExtendedComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => GCPProviderExtendedComponent), multi: true}
  ]
})
export class GCPProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  networks: GCPNetwork[] = [];
  selectedNetwork = '';
  subNetworks: GCPSubnetwork[] = [];
  selectedSubNetwork = '';

  readonly Controls = Controls;

  constructor(
      private readonly _builder: FormBuilder, private readonly _presets: PresetsService,
      private readonly _clusterService: ClusterService) {
    super('GCP Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Network]: this._builder.control(''),
      [Controls.SubNetwork]: this._builder.control(''),
    });

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe))
        .subscribe(
            _ => this._presets.enablePresets(
                Object.values(this._clusterService.cluster.spec.cloud.gcp).every(value => !value)));

    this._clusterService.clusterChanges.pipe(tap(_ => !this._hasRequiredCredentials() ? this.networks = [] : null))
        .pipe(filter(_ => this._hasRequiredCredentials() && this.networks.length === 0))
        .pipe(switchMap(_ => this._networkListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(this._loadNetworks.bind(this));

    this._clusterService.clusterChanges.pipe(tap(_ => !this._hasRequiredCredentials() ? this.subNetworks = [] : null))
        .pipe(filter(_ => this._hasRequiredCredentials() && this.subNetworks.length === 0))
        .pipe(switchMap(_ => this._subnetworkListObservable()))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(subnetworks => this.subNetworks = subnetworks);
  }

  onNetworkChange(network: string): void {
    this._clusterService.cluster.spec.cloud.gcp.network = network;
  }

  onSubNetworkChange(subNetwork: string): void {
    this._clusterService.cluster.spec.cloud.gcp.subnetwork = subNetwork;
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

  private _loadNetworks(networks: GCPNetwork[]): void {
    this.networks = networks;
  }

  private _hasRequiredCredentials(): boolean {
    return !!this._clusterService.cluster.spec.cloud.gcp &&
        !!this._clusterService.cluster.spec.cloud.gcp.serviceAccount;
  }

  private _networkListObservable(): Observable<GCPNetwork[]> {
    return this._presets.provider(NodeProvider.GCP)
        .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
        .networks()
        .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.Network).setValue(undefined);
          return onErrorResumeNext(EMPTY);
        }));
  }

  private _subnetworkListObservable(): Observable<GCPSubnetwork[]> {
    return this._presets.provider(NodeProvider.GCP)
        .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
        .network(this.form.get(Controls.Network).value)
        .subnetworks(this._clusterService.datacenter)
        .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(catchError(() => {
          this.form.get(Controls.SubNetwork).setValue(undefined);
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
