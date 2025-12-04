// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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
  EventEmitter,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {PresetsService} from '@core/services/wizard/presets';
import {FilteredComboboxComponent} from '@shared/components/combobox/component';
import {CloudSpec, Cluster, ClusterSpec, VSphereCloudSpec, VSphereTags} from '@shared/entity/cluster';
import {VSphereFolder, VSphereNetwork, VSphereTagCategory} from '@shared/entity/provider/vsphere';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

import {KUBERNETES_RESOURCE_NAME_PATTERN} from '@app/shared/validators/others';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import _ from 'lodash';
import {EMPTY, forkJoin, merge, Observable, of, onErrorResumeNext} from 'rxjs';
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
import {NodeDataService} from '@app/core/services/node-data/service';

enum Controls {
  Networks = 'networks',
  Folder = 'folder',
  Datastore = 'datastore',
  DatastoreCluster = 'datastoreCluster',
  ResourcePool = 'resourcePool',
  BaseFolderPath = 'basePath',
  TagCategory = 'tagCategory',
  Tags = 'tags',
}

enum NetworkState {
  Empty = 'No Networks Available',
  Loading = 'Loading...',
  Ready = 'Networks',
}

enum FolderState {
  Empty = 'No Folders Available',
  Loading = 'Loading...',
  Ready = 'Folder',
}

enum TagCategoryState {
  Empty = 'No Tag Category Available',
  Loading = 'Loading...',
  Ready = 'Tag Category',
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
  standalone: false,
})
export class VSphereProviderExtendedComponent extends BaseFormValidator implements OnInit, AfterViewInit, OnDestroy {
  private readonly _debounceTime = 500;
  private _networkMap: {[type: string]: VSphereNetwork[]} = {};
  private _credentialsChanged = new EventEmitter<void>();
  private _username = '';
  private _password = '';

  @ViewChild('folderCombobox')
  private readonly _folderCombobox: FilteredComboboxComponent;
  @ViewChild('networkCombobox')
  private readonly _networkCombobox: FilteredComboboxComponent;
  @ViewChild('tagCategoryComboBox')
  private readonly _tagCategoryComboBox: FilteredComboboxComponent;
  readonly Controls = Controls;
  readonly FolderState = FolderState;
  isPresetSelected = false;
  datastores: string[] = [];
  isLoadingDatastores = false;
  folders: VSphereFolder[] = [];
  folderLabel = FolderState.Empty;
  networkLabel = NetworkState.Empty;
  tagCategories: VSphereTagCategory[] = [];
  predefinedTagList: string[] = [];
  tagCategoryLabel = TagCategoryState.Empty;
  selectedTagCategory = '';
  tags: string[] = [];
  networks: string[] = [];
  tagValuesPattern = KUBERNETES_RESOURCE_NAME_PATTERN;
  tagValuesPatternError =
    'Field can only contain <b>alphanumeric characters</b> and <b>dashes</b> (a-z, 0-9 and -). <b>Must not start or end with dash</b>.';

  get networkTypes(): string[] {
    return Object.keys(this._networkMap);
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presets: PresetsService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _nodeDataService: NodeDataService
  ) {
    super('VSphere Provider Extended');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Networks]: this._builder.control({value: [], disabled: true}),
      [Controls.Folder]: this._builder.control({value: '', disabled: true}),
      [Controls.BaseFolderPath]: this._builder.control({value: '', disabled: true}),
      [Controls.Datastore]: this._builder.control(''),
      [Controls.DatastoreCluster]: this._builder.control(''),
      [Controls.ResourcePool]: this._builder.control(''),
      [Controls.TagCategory]: this._builder.control(''),
      [Controls.Tags]: this._builder.control([]),
    });

    this.form.get(Controls.Tags).disable();

    this._presets.presetChanges.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      this.isPresetSelected = !!preset;
      Object.values(Controls).forEach(control => {
        if (control !== Controls.TagCategory && control !== Controls.Tags) {
          this._enable(!this.isPresetSelected, control);
        }
      });
    });

    this._clusterSpecService.clusterChanges
      .pipe(filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._handleClusterChange.bind(this));

    this._clusterSpecService.clusterChanges
      .pipe(
        filter(_ => this._clusterSpecService.provider === NodeProvider.VSPHERE),
        debounceTime(this._debounceTime),
        tap(_ => (!this.hasRequiredCredentials() ? this._clearDatastores() : null)),
        switchMap(_ => this._datastoresObservable()),
        takeUntil(this._unsubscribe)
      )
      .subscribe(datastores => {
        this.datastores = datastores;
        this._setIsLoadingDatastores(false);
      });

    // Mutually exclusive fields
    this.form
      .get(Controls.Datastore)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((val: {main: string}) => this._enable(!val.main, Controls.DatastoreCluster));

    this.form
      .get(Controls.DatastoreCluster)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(val => this._enable(!val, Controls.Datastore));

    this.form
      .get(Controls.Folder)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((val: {select: string}) => this._enable(!val.select, Controls.BaseFolderPath));

    this.form
      .get(Controls.BaseFolderPath)
      .valueChanges.pipe(filter(_ => !this._presets.preset))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe((value: string) => this._enable(!value, Controls.Folder));

    merge(
      this.form.get(Controls.DatastoreCluster).valueChanges,
      this.form.get(Controls.ResourcePool).valueChanges,
      this.form.get(Controls.BaseFolderPath).valueChanges
    )
      .pipe(distinctUntilChanged(), takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterSpecService.cluster = this._getCluster()));

    this.form
      .get(Controls.Datastore)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(d => (this._clusterSpecService.cluster.spec.cloud.vsphere.datastore = d));
  }

  ngAfterViewInit(): void {
    this._credentialsChanged
      .pipe(debounceTime(this._debounceTime))
      .pipe(tap(_ => this._clearFolders()))
      .pipe(tap(_ => this._clearNetworks()))
      .pipe(switchMap(_ => forkJoin([this._folderListObservable(), this._networkListObservable()])))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([folders, networks]) => {
        this._loadFolders(folders);
        this._loadNetworks(networks);
      });

    merge(this._credentialsChanged, this._presets.presetChanges)
      .pipe(debounceTime(this._debounceTime))
      .pipe(switchMap(_ => this._tagCategoryListObservable()))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._loadTagCategories.bind(this));
  }

  getNetworks(type: string): VSphereNetwork[] {
    return this._networkMap[type];
  }

  onNetworkChange(networks: string[]): void {
    this._clusterSpecService.cluster.spec.cloud.vsphere.networks = networks;
  }

  onFolderChange(folder: string): void {
    this._clusterSpecService.cluster.spec.cloud.vsphere.folder = folder;
  }

  onLoadingTags(): void {}

  onTagCategoryChange(tagCategory: string): void {
    this.selectedTagCategory = tagCategory;
    this.predefinedTagList = [];
    if (tagCategory) {
      this.form.get(Controls.Tags).enable();
      this.onTagValuesChange(this.tags);
      this._nodeDataService.vsphere
        .categoryTags(tagCategory)
        .pipe(take(1))
        .subscribe(tags => {
          this.predefinedTagList = tags.map(t => t.name);
          this._cdr.detectChanges();
        });
    } else {
      this.form.get(Controls.Tags).reset();
      this.form.get(Controls.Tags).disable();
      this.onTagValuesChange([]);
    }
  }

  onTagValuesChange(values: string[]): void {
    this.tags = values;

    if (this.selectedTagCategory) {
      const tagCategoryID = this.tagCategories.find(tagCategory => tagCategory.name === this.selectedTagCategory)?.id;
      this._clusterSpecService.cluster.spec.cloud.vsphere.tags = {
        categoryID: tagCategoryID,
        tags: values,
      } as VSphereTags;
    } else {
      this._clusterSpecService.cluster.spec.cloud.vsphere.tags = null;
    }
    this._clusterSpecService.providerSpecChanges.emit();
  }

  getHint(control: Controls): string {
    if (!this.hasRequiredCredentials()) {
      return 'Please enter your credentials first.';
    }
    switch (control) {
      case Controls.Folder:
        return 'Folder is used to group the provisioned virtual machines. It is mutually exclusive with Base Folder Path field.';
    }

    return '';
  }

  hasRequiredCredentials(): boolean {
    return (
      (!!this._clusterSpecService.cluster.spec.cloud.vsphere?.username &&
        !!this._clusterSpecService.cluster.spec.cloud.vsphere?.password) ||
      (!!this._clusterSpecService.cluster.spec.cloud.vsphere?.infraManagementUser?.username &&
        !!this._clusterSpecService.cluster.spec.cloud.vsphere?.infraManagementUser?.password) ||
      (!!this._clusterSpecService.cluster.spec.cloud.vsphere && !!this._presets.preset)
    );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _handleClusterChange(cluster: Cluster): void {
    let markAsChanged = false;
    const username = cluster.spec.cloud.vsphere.infraManagementUser?.username || cluster.spec.cloud.vsphere.username;
    const password = cluster.spec.cloud.vsphere.infraManagementUser?.password || cluster.spec.cloud.vsphere.password;

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

  private _loadTagCategories(tagCategories: VSphereTagCategory[]): void {
    this.tagCategories = tagCategories;

    if (!_.isEmpty(this.tagCategories)) {
      this.tagCategoryLabel = TagCategoryState.Ready;
      this._cdr.detectChanges();
    }
  }

  private _networkListObservable(): Observable<VSphereNetwork[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.username ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.username
      )
      .password(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.password ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.password
      )
      .datacenter(this._clusterSpecService.datacenter)
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
      .username(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.username ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.username
      )
      .password(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.password ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.password
      )
      .datacenter(this._clusterSpecService.datacenter)
      .folders(this._onFoldersLoading.bind(this))
      .pipe(
        catchError(_ => {
          this._clearFolders();
          return of([]);
        })
      );
  }

  private _tagCategoryListObservable(): Observable<VSphereTagCategory[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.username ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.username
      )
      .password(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.password ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.password
      )
      .credential(this._presets.preset)
      .datacenter(this._clusterSpecService.datacenter)
      .tagCategories(this._onTagCategoryLoading.bind(this))
      .pipe(
        catchError(_ => {
          this._clearTagCategories();
          return onErrorResumeNext(EMPTY);
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

  private _onTagCategoryLoading(): void {
    this.tagCategoryLabel = TagCategoryState.Loading;
    this._cdr.detectChanges();
  }

  private _clearTagCategories(): void {
    this.tagCategories = [];
    this.tagCategoryLabel = TagCategoryState.Empty;
    this._tagCategoryComboBox.reset();
    this._cdr.detectChanges();
  }

  private _datastoresObservable(): Observable<string[]> {
    return this._presets
      .provider(NodeProvider.VSPHERE)
      .username(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.username ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.username
      )
      .password(
        this._clusterSpecService.cluster.spec.cloud.vsphere.infraManagementUser?.password ||
          this._clusterSpecService.cluster.spec.cloud.vsphere.password
      )
      .datacenter(this._clusterSpecService.datacenter)
      .datastores(() => this._setIsLoadingDatastores(true))
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
    this.form.get(Controls.Datastore).setValue(AutocompleteInitialState);
    this._setIsLoadingDatastores(false);
  }

  private _setIsLoadingDatastores(isLoading: boolean): void {
    this.isLoadingDatastores = isLoading;
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

  private _getCluster(): Cluster {
    return {
      spec: {
        cloud: {
          vsphere: {
            datastoreCluster: this.form.get(Controls.DatastoreCluster).value,
            resourcePool: this.form.get(Controls.ResourcePool).value,
            basePath: this.form.get(Controls.BaseFolderPath).value,
          } as VSphereCloudSpec,
        } as CloudSpec,
      } as ClusterSpec,
    } as Cluster;
  }
}
