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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {
  CreatePresetDialogComponent,
  CreatePresetDialogData,
  Mode,
} from '@app/settings/admin/presets/create-dialog/component';
import {DatacenterService} from '@core/services/datacenter/service';
import {UserService} from '@core/services/user/service';
import {PresetsService} from '@core/services/wizard/presets.service';
import {Datacenter} from '@shared/entity/datacenter';
import {Preset} from '@shared/entity/preset';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

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
  statusFilter: boolean;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _userService: UserService,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _matDialog: MatDialog
  ) {}

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

    this._presetService
      .presets()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(presetList => {
        this.presets = presetList.items;
        this.dataSource.data = this.presets;
      });

    this._datacenterService.datacenters
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(datacenters => (this.datacenters = datacenters));

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
    //   this.dataSource.data = this.datacenters.filter(datacenter => {
    //     let isVisible = true;
    //
    //     if (this.countryFilter) {
    //       isVisible = isVisible && datacenter.spec.country === this.countryFilter;
    //     }
    //
    //     if (this.seedFilter) {
    //       isVisible = isVisible && datacenter.spec.seed === this.seedFilter;
    //     }
    //
    //     if (this.providerFilter) {
    //       isVisible = isVisible && datacenter.spec.provider === this.providerFilter;
    //     }
    //
    //     return isVisible;
    //   });
  }

  createPreset(): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-create-preset-dialog',
      data: {
        title: 'Create a Preset',
        steps: ['Preset', 'Provider', 'Settings'],
        mode: Mode.Create,
      } as CreatePresetDialogData,
    };

    this._matDialog
      .open(CreatePresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  addProvider(preset: Preset): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-create-preset-dialog',
      data: {
        title: 'Add Provider',
        steps: ['Provider', 'Settings'],
        mode: Mode.Add,
        preset: preset,
      } as CreatePresetDialogData,
    };

    this._matDialog
      .open(CreatePresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  canAddProvider(preset: Preset): boolean {
    return (
      Object.values(NodeProvider).filter(
        p => [NodeProvider.BAREMETAL, NodeProvider.BRINGYOUROWN, NodeProvider.NONE].indexOf(p) < 0
      ).length > preset.providers.length
    );
  }

  editProvider(preset: Preset): void {
    const dialogConfig: MatDialogConfig = {
      panelClass: 'km-create-preset-dialog',
      data: {
        title: 'Edit Provider',
        steps: ['Provider', 'Settings'],
        mode: Mode.Edit,
        preset: preset,
      } as CreatePresetDialogData,
    };

    this._matDialog
      .open(CreatePresetDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {});
  }

  // private _add(datacenter: Datacenter): void {
  //   const model: CreateDatacenterModel = {
  //     name: datacenter.metadata.name,
  //     spec: datacenter.spec,
  //   };
  //
  //   this._datacenterService
  //     .createDatacenter(model)
  //     .pipe(take(1))
  //     .subscribe(datacenter => {
  //       this._notificationService.success(`The <strong>${datacenter.metadata.name}</strong> datacenter was created`);
  //       this._datacenterService.refreshDatacenters();
  //     });
  // }

  // edit(datacenter: Datacenter): void {
  //   const dialogConfig: MatDialogConfig = {
  //     data: {
  //       title: 'Edit Datacenter',
  //       datacenter: datacenter,
  //       isEditing: true,
  //       confirmLabel: 'Edit',
  //     },
  //   };
  //
  //   this._matDialog
  //     .open(DatacenterDataDialogComponent, dialogConfig)
  //     .afterClosed()
  //     .pipe(filter(datacenter => !!datacenter))
  //     .pipe(take(1))
  //     .subscribe((result: Datacenter) => this._edit(datacenter, result));
  // }
  //
  // private _edit(original: Datacenter, edited: Datacenter): void {
  //   this._datacenterService
  //     .patchDatacenter(original.spec.seed, original.metadata.name, edited)
  //     .pipe(take(1))
  //     .subscribe(datacenter => {
  //       this._notificationService.success(`The <strong>${datacenter.metadata.name}</strong> datacenter was updated`);
  //       this._datacenterService.refreshDatacenters();
  //     });
  // }
  //
  // delete(datacenter: Datacenter): void {
  //   const dialogConfig: MatDialogConfig = {
  //     data: {
  //       title: 'Delete Datacenter',
  //       message: `Are you sure you want to delete the ${datacenter.metadata.name} datacenter?`,
  //       confirmLabel: 'Delete',
  //     },
  //   };
  //
  //   this._matDialog
  //     .open(ConfirmationDialogComponent, dialogConfig)
  //     .afterClosed()
  //     .pipe(filter(isConfirmed => isConfirmed))
  //     .pipe(switchMap(_ => this._datacenterService.deleteDatacenter(datacenter)))
  //     .pipe(take(1))
  //     .subscribe(_ => {
  //       this._notificationService.success(`The <strong>${datacenter.metadata.name}</strong> datacenter was deleted`);
  //       this._datacenterService.refreshDatacenters();
  //     });
  // }

  isPaginatorVisible(): boolean {
    return (
      this.datacenters &&
      this.datacenters.length > 0 &&
      this.paginator &&
      this.datacenters.length > this.paginator.pageSize
    );
  }
}
