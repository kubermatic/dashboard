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
  EventEmitter,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {PresetsService} from '@core/services/wizard/presets.service';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {CloudSpec, Cluster, ClusterSpec, VSphereCloudSpec} from '@shared/entity/cluster';
import {VSphereFolder, VSphereNetwork} from '@shared/entity/provider/vsphere';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {ClusterService} from '@shared/services/cluster.service';
import {isObjectEmpty} from '@shared/utils/common-utils';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

import * as _ from 'lodash';
import {EMPTY, forkJoin, Observable, of, onErrorResumeNext} from 'rxjs';
import {catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';

enum Controls {
  VMNetName = 'vmNetName',
  Folder = 'folder',
  Datastore = 'datastore',
  DatastoreCluster = 'datastoreCluster',
}

enum NetworkState {
  Empty = 'No Networks Available',
  Loading = 'Loading...',
  Ready = 'Network',
}

enum FolderState {
  Empty = 'No Folders Available',
  Loading = 'Loading...',
  Ready = 'Folder',
}

@Component({
  selector: 'km-wizard-vsphere-provider-extended',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VSphereProviderExtendedComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => VSphereProviderExtendedComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VSphereProviderExtendedComponent extends BaseFormValidator implements OnInit, OnDestroy {
  private readonly _debounceTime = 1000;
  private _networkMap: {[type: string]: VSphereNetwork[]} = {};
  private _credentialsChanged = new EventEmitter<void>();
  private _username = '';
  private _password = '';

  @ViewChild('folderCombobox')
  private readonly _folderCombobox: FilteredComboboxComponent;
  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;
  datastores: string[] = [];
  folders: VSphereFolder[] = [];
  folderLabel = FolderState.Empty;
  networkLabel = NetworkState.Empty;

  get networkTypes(): string[] {
    return Object.keys(this._networkMap);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterService: ClusterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super('VSphere Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VMNetName]: this._builder.control({value: '', disabled: true}),
      [Controls.Folder]: this._builder.control({value: '', disabled: true}),
      [Controls.Datastore]: this._builder.control({value: '', disabled: false}),
      [Controls.DatastoreCluster]: this._builder.control({value: '', disabled: false}),
    });

    this.form.valueChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.VSPHERE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._presets.enablePresets(isObjectEmpty(this._clusterService.cluster.spec.cloud.vsphere)));

    this._presets.presetChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(preset => Object.values(Controls).forEach(control => this._enable(!preset, control)));

    this._clusterService.clusterChanges
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.VSPHERE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._handleClusterChange.bind(this));

    this._credentialsChanged
      .pipe(tap(_ => this._clearFolders()))
      .pipe(tap(_ => this._clearNetworks()))
      .pipe(switchMap(_ => forkJoin([this._folderListObservable(), this._networkListObservable()])))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([folders, networks]) => {
        this._loadFolders(folders);
        this._loadNetworks(networks);
      });

    this._clusterService.clusterChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(filter(_ => this._clusterService.provider === NodeProvider.VSPHERE))
      .pipe(tap(_ => (!this.hasRequiredCredentials() ? this._clearDatastores() : null)))
      .pipe(switchMap(_ => this._datastoresObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datastores => (this.datastores = datastores));

    // Mutually exclusive fields
    this.form
      .get(Controls.Datastore)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(val => this._enable(!val, Controls.DatastoreCluster));

    this.form
      .get(Controls.DatastoreCluster)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(val => this._enable(!val, Controls.Datastore));

    this.form
      .get(Controls.DatastoreCluster)
      .valueChanges.pipe(distinctUntilChanged())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterService.cluster = this._getCluster()));

    this.form
      .get(Controls.Datastore)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(d => (this._clusterService.cluster.spec.cloud.vsphere.datastore = d));
  }

  getNetworks(type: string): VSphereNetwork[] {
    return this._networkMap[type];
  }

  onNetworkChange(network: string): void {
    this._clusterService.cluster.spec.cloud.vsphere.vmNetName = network;
  }

  onFolderChange(folder: string): void {
    this._clusterService.cluster.spec.cloud.vsphere.folder = folder;
  }

  getHint(control: Controls): string {
    switch (control) {
      case Controls.VMNetName:
      case Controls.Folder:
        return this.hasRequiredCredentials() ? '' : 'Please enter your credentials first.';
    }

    return '';
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleClusterChange(cluster: Cluster): void {
    let markAsChanged = false;
    const username = cluster.spec.cloud.vsphere.username;
    const password = cluster.spec.cloud.vsphere.password;
    if (username !== this._username) {
      this._username = username;
      markAsChanged = true;
    }

    if (password !== this._password) {
      this._password = password;
      markAsChanged = true;
    }

    if (markAsChanged) {
      this._credentialsChanged.emit();
    }
  }

  private _loadNetworks(networks: VSphereNetwork[]): void {
    networks.forEach(network => {
      const find = this.networkTypes.find(x => x === network.type);
      if (!find) {
        this._networkMap[network.type] = [];
      }
      this._networkMap[network.type].push(network);
    });

    if (!_.isEmpty(networks)) {
      this.networkLabel = NetworkState.Ready;
      this._cdr.detectChanges();
    }
  }

  private _loadFolders(folders: VSphereFolder[]): void {
    this.folders = folders;

    if (!_.isEmpty(this.folders)) {
      this.folderLabel = FolderState.Ready;
      this._cdr.detectChanges();
    }
  }

  hasRequiredCredentials(): boolean {
    return (
      !!this._clusterService.cluster.spec.cloud.vsphere &&
      !!this._clusterService.cluster.spec.cloud.vsphere.username &&
      !!this._clusterService.cluster.spec.cloud.vsphere.password
    );
  }

  private _networkListObservable(): Observable<VSphereNetwork[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(this._clusterService.cluster.spec.cloud.vsphere.username)
      .password(this._clusterService.cluster.spec.cloud.vsphere.password)
      .datacenter(this._clusterService.datacenter)
      .networks(this._onNetworksLoading.bind(this))
      .pipe(map(networks => _.sortBy(networks, n => n.name.toLowerCase())))
      .pipe(
        catchError(_ => {
          this._clearNetworks();
          return of([]);
        })
      );
  }

  private _onNetworksLoading(): void {
    this._clearNetworks();
    this.networkLabel = NetworkState.Loading;
    this._cdr.detectChanges();
  }

  private _clearNetworks(): void {
    this._networkMap = {};
    this.networkLabel = NetworkState.Empty;
    this._networkCombobox.reset();
    this._cdr.detectChanges();
  }

  private _folderListObservable(): Observable<VSphereFolder[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(this._clusterService.cluster.spec.cloud.vsphere.username)
      .password(this._clusterService.cluster.spec.cloud.vsphere.password)
      .datacenter(this._clusterService.datacenter)
      .folders(this._onFoldersLoading.bind(this))
      .pipe(
        catchError(_ => {
          this._clearFolders();
          return of([]);
        })
      );
  }

  private _onFoldersLoading(): void {
    this._clearNetworks();
    this.folderLabel = FolderState.Loading;
    this._cdr.detectChanges();
  }

  private _clearFolders(): void {
    this.folders = [];
    this.folderLabel = FolderState.Empty;
    this._folderCombobox.reset();
    this._cdr.detectChanges();
  }

  private _datastoresObservable(): Observable<string[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(this._clusterService.cluster.spec.cloud.vsphere.username)
      .password(this._clusterService.cluster.spec.cloud.vsphere.password)
      .datacenter(this._clusterService.datacenter)
      .datastores()
      .pipe(
        map(datastores => _.sortBy(datastores, d => d.toLowerCase())),
        catchError(() => {
          this._clearDatastores();
          return onErrorResumeNext(EMPTY);
        })
      );
  }

  private _clearDatastores(): void {
    this.datastores = [];
    this.form.get(Controls.Datastore).setValue('');
  }

  private _enable(enable: boolean, name: string): void {
    if (enable && this.form.get(name).disabled) {
      this.form.get(name).enable();
    }

    if (!enable && this.form.get(name).enabled) {
      this.form.get(name).disable();
    }
  }

  private _getCluster(): Cluster {
    return {
      spec: {
        cloud: {
          vsphere: {
            datastoreCluster: this.form.get(Controls.DatastoreCluster).value,
          } as VSphereCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
