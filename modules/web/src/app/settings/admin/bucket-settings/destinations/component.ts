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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {MatSort} from '@angular/material/sort';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {BackupService} from '@core/services/backup';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent, ConfirmationDialogConfig} from '@shared/components/confirmation-dialog/component';
import {AdminSeed, BackupDestination} from '@shared/entity/datacenter';
import {DestinationDialog, Mode} from './destination-dialog/component';
import {EditCredentialsDialog} from './edit-credentials-dialog/component';
import {filter, switchMap, take} from 'rxjs/operators';
import {DialogModeService} from '@app/core/services/dialog-mode';

@Component({
  selector: 'km-destinations',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class DestinationsComponent implements OnInit {
  @Input() seed?: AdminSeed;
  displayedColumns: string[] = ['name', 'bucket', 'endpoint', 'credentials', 'actions'];
  dataSource = new MatTableDataSource<any>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  destinations: BackupDestination[] = [];

  constructor(
    private readonly _datacenterService: DatacenterService,
    private readonly _backupService: BackupService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService,
    private readonly _dialogModeService: DialogModeService
  ) {}

  ngOnInit(): void {
    this._mapToArray();

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
  }

  getDataSource(): MatTableDataSource<any> {
    this.dataSource.data = this.destinations ? this.destinations : [];
    return this.dataSource;
  }

  hasDestinations(): boolean {
    return !!this.seed?.spec?.etcdBackupRestore?.destinations;
  }

  hasCredentials(destination: BackupDestination): boolean {
    return !!destination?.credentials;
  }

  isDefault(name: string): boolean {
    return this.seed?.spec?.etcdBackupRestore?.defaultDestination === name;
  }

  addDestination(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Destination',
        mode: Mode.Add,
        seed: this.seed,
      },
    };

    this._matDialog.open(DestinationDialog, dialogConfig);
  }

  editDestination(destination: BackupDestination): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Destination',
        mode: Mode.Edit,
        seed: this.seed,
        destination: destination,
      },
    };

    this._dialogModeService.isEditDialog = true;
    this._matDialog
      .open(DestinationDialog, dialogConfig)
      .afterClosed()
      .pipe(take(1))
      .subscribe(_ => {
        this._dialogModeService.isEditDialog = false;
      });
  }

  editCredentials(destination: BackupDestination): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        seed: this.seed,
        destination: destination,
      },
    };

    this._matDialog.open(EditCredentialsDialog, dialogConfig);
  }

  deleteDestination(destination: BackupDestination): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Destination',
        message: `Delete <b>${destination.destinationName}</b> destination permanently?`,
        warning: 'Associated backups and snapshots will not be usable after deleting this destination.',
        confirmLabel: 'Delete Destination',
      } as ConfirmationDialogConfig,
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._backupService.deleteBackupDestination(this.seed.name, destination.destinationName)))
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success(`Deleting the ${destination.destinationName} destination`);
        this._datacenterService.refreshAdminSeeds();
      });
  }

  private _mapToArray(): void {
    if (this.hasDestinations()) {
      for (const [k, v] of Object.entries(this.seed.spec.etcdBackupRestore.destinations)) {
        this.destinations.push({
          destinationName: k,
          bucketName: v.bucketName,
          endpoint: v.endpoint,
          credentials: v.credentials,
        });
      }
    }
  }
}
