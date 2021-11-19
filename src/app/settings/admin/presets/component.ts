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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Mode, PresetDialogComponent, PresetDialogData} from '@app/settings/admin/presets/dialog/component';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {EditPresetDialogComponent} from '@app/settings/admin/presets/edit-dialog/component';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {PresetsService} from '@core/services/wizard/presets';
import {Datacenter} from '@shared/entity/datacenter';
import {Preset, PresetList} from '@shared/entity/preset';
import {NodeProvider, NodeProviderConstants} from '@shared/model/NodeProviderConstants';
import {merge, Observable, of, Subject} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';

enum Column {
  Name = 'name',
  Providers = 'providers',
  Show = 'show',
  Actions = 'actions',
}

@Component({
  selector: 'km-preset-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class PresetListComponent implements OnInit, OnDestroy, OnChanges {
  presets: Preset[] = [];
  dataSource = new MatTableDataSource<Preset>();
  displayedColumns: string[] = Object.values(Column);
  datacenters: Datacenter[] = [];
  datacenterFilter: string;
  providers: NodeProvider[] = Object.values(NodeProvider).filter(provider => !!provider);
  providerFilter: NodeProvider;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _unsubscribe = new Subject<void>();
  private _supportedProviders: NodeProvider[] = [];
  private _presetsChanged = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialog: MatDialog,
    private readonly _presetDialogService: PresetDialogService,
    private readonly _notificationService: NotificationService
  ) {}

  get _presets$(): Observable<PresetList> {
    if (this.datacenterFilter) {
      return this._presetService.presets(true, this.providerFilter, this.datacenterFilter);
    }

    if (this.providerFilter) {
      return this._presetService.presets(true, this.providerFilter);
    }

    return this._presetService.presets(true);
  }

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = Column.Name;
    this.sort.direction = 'asc';

    this.dataSource.sortingDataAccessor = (preset, property) => {
      switch (property) {
        case Column.Name:
          return preset.name;
        case Column.Show:
          return preset.enabled;
        default:
          return preset[property];
      }
    };

    merge(of(true), this._presetsChanged)
      .pipe(switchMap(_ => this._presets$))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(presetList => {
        this.presets = presetList.items;
        this.dataSource.data = this.presets;
      });

    this._datacenterService.datacenters.pipe(takeUntil(this._unsubscribe)).subscribe(datacenters => {
      this.datacenters = datacenters;
      const uniqueProviders = new Set<NodeProvider>(
        this.datacenters.map(dc => NodeProviderConstants.newNodeProvider(dc.spec.provider))
      );
      this._supportedProviders = Array.from(uniqueProviders);
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.filter();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  filter(): void {
    this._presetsChanged.next();
  }

  createPreset(): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-preset-dialog',
      maxWidth: '600px',
      data: {
        title: 'Create Preset',
        steps: ['Preset', 'Provider', 'Settings'],
        mode: Mode.Create,
      } as PresetDialogData,
    };

    this._matDialog
      .open(PresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(created => (created === true ? this._presetsChanged.next() : null));
  }

  editPreset(preset: Preset): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-preset-dialog',
      data: {
        preset: preset,
      } as PresetDialogData,
    };

    this._matDialog
      .open(EditPresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  canAddProvider(preset: Preset): boolean {
    return (
      this._supportedProviders.filter(p => this._presetDialogService.unsupportedProviders.indexOf(p) < 0).length >
      preset.providers.length
    );
  }

  addProvider(preset: Preset): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-preset-dialog',
      maxWidth: '600px',
      data: {
        title: 'Add Preset Provider',
        steps: ['Provider', 'Settings'],
        mode: Mode.Add,
        preset: preset,
        descriptionProvider: `Add provider to <b>${preset.name}</b> preset`,
        descriptionSettings: `Specify provider settings for <b>${preset.name}</b> provider preset`,
      } as PresetDialogData,
    };

    this._matDialog
      .open(PresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(created => (created === true ? this._presetsChanged.next() : null));
  }

  editProvider(preset: Preset): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-preset-dialog',
      maxWidth: '600px',
      data: {
        title: 'Edit Preset Provider',
        steps: ['Provider', 'Settings'],
        descriptionProvider: `Choose a provider of <b>${preset.name}</b> provider preset to edit`,
        descriptionSettings: `Edit provider settings of <b>${preset.name}</b> provider preset`,
        mode: Mode.Edit,
        preset: preset,
      } as PresetDialogData,
    };

    this._matDialog
      .open(PresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(created => (created === true ? this._presetsChanged.next() : null));
  }

  updatePresetStatus(name: string, enabled: boolean): void {
    this._presetService
      .updateStatus(name, {enabled: enabled})
      .pipe(take(1))
      .subscribe(_ => {
        const idx = this.presets.findIndex(p => p.name === name);
        this.presets[idx].enabled = enabled;
        this._notificationService.success(`${enabled ? 'Enabled' : 'Disabled'} preset ${name}.`);
      });
  }

  isPaginatorVisible(): boolean {
    return this.presets && this.presets.length > 0 && this.paginator && this.presets.length > this.paginator.pageSize;
  }
}
