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
import {EMPTY, Observable, onErrorResumeNext} from 'rxjs';
import {catchError, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

import {PresetsService} from '../../../../../../core/services';
import {FilteredComboboxComponent} from '../../../../../../shared/components/combobox/component';
import {NodeProvider} from '../../../../../../shared/model/NodeProviderConstants';
import {BaseFormValidator} from '../../../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../../service/cluster';
import {GCPNetwork, GCPSubnetwork} from '../../../../../../shared/entity/provider/gcp';

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
})
export class GCPProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private _onNetworkChange = new EventEmitter<void>();

  readonly Controls = Controls;

  networks: GCPNetwork[] = [];
  networkLabel = NetworkState.Empty;
  subNetworks: GCPSubnetwork[] = [];
  subNetworkLabel = SubNetworkState.Empty;

  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;
  @ViewChild('subNetworkCombobox')
  private readonly _subNetworkCombobox: FilteredComboboxComponent;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('GCP Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Network]: this._builder.control(''),
      [Controls.SubNetwork]: this._builder.control(''),
    });

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(Object.values(this._clusterService.cluster.spec.cloud.gcp).every(value => !value))
      );

    this._clusterService.clusterChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.GCP))
      .pipe(
        tap(_ => {
          if (!this._hasRequiredCredentials()) {
            this._clearNetwork();
            this._clearSubNetwork();
          }
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials()))
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
    this._clusterService.cluster.spec.cloud.gcp.network = network;
    this._clearSubNetwork();
    this._onNetworkChange.emit();
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

  private _hasRequiredCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.gcp && !!this._clusterService.cluster.spec.cloud.gcp.serviceAccount
    );
  }

  private _loadNetworks(networks: GCPNetwork[]): void {
    this.networkLabel = networks.length > 0 ? NetworkState.Ready : NetworkState.Empty;
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
      .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
      .networks(this._onNetworkLoading.bind(this))
      .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
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
      .serviceAccount(this._clusterService.cluster.spec.cloud.gcp.serviceAccount)
      .network(this._clusterService.cluster.spec.cloud.gcp.network)
      .subnetworks(this._clusterService.datacenter, this._onSubNetworkLoading.bind(this))
      .pipe(map(networks => networks.sort((a, b) => a.name.localeCompare(b.name))))
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
    this.subNetworkLabel = subNetworks.length > 0 ? SubNetworkState.Ready : SubNetworkState.Empty;
    this.subNetworks = subNetworks;
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
