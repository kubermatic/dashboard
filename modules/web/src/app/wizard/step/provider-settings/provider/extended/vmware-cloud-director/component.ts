// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, forwardRef} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {PresetsService} from '@core/services/wizard/presets';
import {
  CloudSpec,
  Cluster,
  ClusterSpec,
  VMwareCloudDirectorCSIConfig,
  VMwareCloudDirectorCloudSpec,
} from '@shared/entity/cluster';
import {Datacenter} from '@shared/entity/datacenter';
import {
  VMwareCloudDirectorNetwork,
  VMwareCloudDirectorStorageProfile,
} from '@shared/entity/provider/vmware-cloud-director';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {EMPTY, Observable, forkJoin, merge, of, onErrorResumeNext} from 'rxjs';
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
  OvdcNetworks = 'ovdcNetworks',
  StorageProfile = 'storageProfile',
  Filesystem = 'filesystem',
}

enum Filesystem {
  XFS = 'xfs',
  EXT4 = 'ext4',
}

enum NetworkState {
  Ready = 'Organization VDC Networks',
  Empty = 'No organization VDC networks available',
  Loading = 'Loading...',
}

enum StorageProfileState {
  Ready = 'Storage Profile',
  Empty = 'No storage profiles available',
  Loading = 'Loading...',
}

@Component({
  selector: 'km-wizard-vmware-cloud-director-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VMwareCloudDirectorProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VMwareCloudDirectorProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class VMwareCloudDirectorProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _alwaysEnabledControls = [Controls.StorageProfile, Controls.Filesystem];
  private readonly _debounceTime = 500;
  private readonly _defaultFilesystem = Filesystem.EXT4;
  readonly Controls = Controls;
  readonly fstypes = [Filesystem.XFS, Filesystem.EXT4];
  private _preset = '';
  private _username = '';
  private _password = '';
  private _apiToken = '';
  private _organization = '';
  private _vdc = '';
  networks: VMwareCloudDirectorNetwork[] = [];
  selectedNetworks: string[] = [];
  networkLabel = NetworkState.Empty;
  storageProfiles: VMwareCloudDirectorStorageProfile[] = [];
  selectedStorageProfile = '';
  storageProfileLabel = StorageProfileState.Empty;
  isPresetSelected = false;
  isCSIDriverDisabled = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('VMware Cloud Director Provider Extended');
  }

  ngOnInit(): void {
    this._initForm();

    this.form
      .get(Controls.Filesystem)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getClusterEntity()));

    merge(
      Object.values(Controls)
        .filter(control => !this._alwaysEnabledControls.includes(control))
        .map(control => this.form.get(control).valueChanges)
    )
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._presets.enablePresets(
          VMwareCloudDirectorCloudSpec.isEmpty(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector)
        )
      );

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      Object.values(Controls)
        .filter(control => !this._alwaysEnabledControls.includes(control))
        .forEach(control => {
          this._enable(!this.isPresetSelected, control);
        });
    });

    merge(this._clusterSpecService.providerChanges, this._clusterSpecService.datacenterChanges)
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this.form.reset({[Controls.Filesystem]: this._defaultFilesystem}));

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VMWARECLOUDDIRECTOR))
      .pipe(debounceTime(this._debounceTime))
      .pipe(
        tap(_ => {
          if (!this._hasRequiredCredentials()) {
            this._clearNetwork();
            this._clearStorageProfile();
            this._clearCredentials();
          }
          this.isCSIDriverDisabled = this._clusterSpecService.cluster.spec.disableCsiDriver;
          this.onCSIDriverDisabled();
        })
      )
      .pipe(filter(_ => this._hasRequiredCredentials()))
      .pipe(filter(cluster => this._areCredentialsChanged(cluster)))
      .pipe(
        switchMap(_ =>
          forkJoin([
            !this.isPresetSelected ? this._networkListObservable() : of([]),
            this._storageProfileListObservable(),
            this._datacenterService.getDatacenter(this._clusterSpecService.datacenter).pipe(take(1)),
          ])
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: ([networks, storageProfiles, dc]) => {
          this._loadNetworks(networks);
          this._setDefaultStorageProfile(storageProfiles, dc);
        },
      });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.OvdcNetworks:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      case Controls.StorageProfile:
        return this._hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
      default:
        return '';
    }
  }

  onNetworkChange(networks: string[]): void {
    this.selectedNetworks = networks;
    this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.ovdcNetworks = networks;
    this._clusterSpecService.clusterChanges.emit(this._clusterSpecService.cluster);
  }

  onStorageProfileChange(storageProfile: string): void {
    this.selectedStorageProfile = storageProfile;
    this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.csi.storageProfile = storageProfile;
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.OvdcNetworks]: this._builder.control([], Validators.required),
      [Controls.StorageProfile]: this._builder.control('', Validators.required),
      [Controls.Filesystem]: this._builder.control(this._defaultFilesystem, Validators.required),
    });
  }

  private onCSIDriverDisabled(): void {
    if (!this.isCSIDriverDisabled) {
      this.form.get(Controls.StorageProfile).setValidators(Validators.required);
      this.form.get(Controls.Filesystem).setValidators(Validators.required);
    } else {
      this.form.get(Controls.StorageProfile).clearValidators();
      this.form.get(Controls.Filesystem).clearValidators();
      this.form.get(Controls.StorageProfile).setValue(undefined);
      this.form.get(Controls.Filesystem).setValue(undefined);
    }
  }

  private _onNetworkLoading(): void {
    this._clearNetwork();
    this.networkLabel = NetworkState.Loading;
    this._cdr.detectChanges();
  }

  private _networkListObservable(): Observable<VMwareCloudDirectorNetwork[]> {
    return this._presets
      .provider(NodeProvider.VMWARECLOUDDIRECTOR)
      .username(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.username)
      .password(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.password)
      .apiToken(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.apiToken)
      .organization(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.organization)
      .vdc(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.vdc)
      .networks(this._clusterSpecService.cluster.spec.cloud.dc, this._onNetworkLoading.bind(this))
      .pipe(map(networks => _.sortBy(networks, p => p.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearNetwork();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _loadNetworks(networks: VMwareCloudDirectorNetwork[]): void {
    this.networkLabel = !_.isEmpty(networks) ? NetworkState.Ready : NetworkState.Empty;
    this.networks = networks;
    this._cdr.detectChanges();
  }

  private _clearNetwork(): void {
    this.networks = [];
    this.selectedNetworks = [];
    this.networkLabel = NetworkState.Empty;
    this._cdr.detectChanges();
  }

  private _onStorageProfileLoading(): void {
    this.storageProfileLabel = StorageProfileState.Loading;
    this._cdr.detectChanges();
  }

  private _storageProfileListObservable(): Observable<VMwareCloudDirectorStorageProfile[]> {
    return this._presets
      .provider(NodeProvider.VMWARECLOUDDIRECTOR)
      .username(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.username)
      .password(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.password)
      .apiToken(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.apiToken)
      .organization(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.organization)
      .vdc(this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.vdc)
      .credential(this._presets.preset)
      .storageProfiles(this._clusterSpecService.cluster.spec.cloud.dc, this._onStorageProfileLoading.bind(this))
      .pipe(map(profiles => _.sortBy(profiles, p => p.name.toLowerCase())))
      .pipe(
        catchError(() => {
          this._clearStorageProfile();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _setDefaultStorageProfile(storageProfiles: VMwareCloudDirectorStorageProfile[], dc: Datacenter): void {
    this.storageProfiles = storageProfiles;
    const dcStorageProfile = dc.spec.vmwareclouddirector?.storageProfile;

    if (
      this.selectedStorageProfile &&
      !this.storageProfiles?.find(profile => profile.name === this.selectedStorageProfile)
    ) {
      this.selectedStorageProfile = '';
    }

    if (
      !this.selectedStorageProfile &&
      dcStorageProfile &&
      this.storageProfiles?.find(profile => profile.name === dcStorageProfile)
    ) {
      this.selectedStorageProfile = dcStorageProfile;
    }

    this.storageProfileLabel = !_.isEmpty(storageProfiles) ? StorageProfileState.Ready : StorageProfileState.Empty;
    this._cdr.detectChanges();
  }

  private _clearStorageProfile(): void {
    this.storageProfiles = [];
    this.storageProfileLabel = StorageProfileState.Empty;
    this.selectedStorageProfile = '';
    this._cdr.detectChanges();
  }

  private _hasRequiredCredentials(): boolean {
    return !!(
      this._presets.preset ||
      (((this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.username &&
        this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.password) ||
        this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.apiToken) &&
        this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.organization &&
        this._clusterSpecService.cluster.spec.cloud.vmwareclouddirector.vdc)
    );
  }

  private _areCredentialsChanged(cluster: Cluster): boolean {
    let credentialsChanged = false;
    if (this._presets.preset !== this._preset) {
      this._preset = this._presets.preset;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.vmwareclouddirector.username !== this._username) {
      this._username = cluster.spec.cloud.vmwareclouddirector.username;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.vmwareclouddirector.password !== this._password) {
      this._password = cluster.spec.cloud.vmwareclouddirector.password;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.vmwareclouddirector.apiToken !== this._apiToken) {
      this._apiToken = cluster.spec.cloud.vmwareclouddirector.apiToken;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.vmwareclouddirector.organization !== this._organization) {
      this._organization = cluster.spec.cloud.vmwareclouddirector.organization;
      credentialsChanged = true;
    }

    if (cluster.spec.cloud.vmwareclouddirector.vdc !== this._vdc) {
      this._vdc = cluster.spec.cloud.vmwareclouddirector.vdc;
      credentialsChanged = true;
    }

    return credentialsChanged;
  }

  private _clearCredentials(): void {
    this._preset = '';
    this._username = '';
    this._password = '';
    this._apiToken = '';
    this._organization = '';
    this._vdc = '';
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
          vmwareclouddirector: {
            csi: {
              filesystem: this.form.get(Controls.Filesystem).value,
            } as VMwareCloudDirectorCSIConfig,
          } as VMwareCloudDirectorCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
