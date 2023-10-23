// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatTableDataSource} from '@angular/material/table';
import {ClusterRestore} from '@app/shared/entity/backup';
import {CookieService} from 'ngx-cookie-service';
import {DeleteRestoreDialogComponent} from './delete-dialog/component';

@Component({
  selector: 'km-cluster-restore-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClustersRestoresListComponent implements OnInit {
  dataSource = new MatTableDataSource<ClusterRestore>();
  selectedRestores: string[] = [];
  selectAll: boolean = false;

  get columns(): string[] {
    return ['select', 'name', 'cluster', 'backupName', 'restored', 'created', 'actions'];
  }

  get canAdd(): boolean {
    return true;
  }

  get data(): any {
    return JSON.parse(this._cookieService.get('restore') || '[]');
  }
  constructor(
    private readonly _cookieService: CookieService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.data;
  }

  onSelectedRestore(restoreName: string): void {
    if (this.selectedRestores.includes(restoreName)) {
      this.selectedRestores = this.selectedRestores.filter(name => name !== restoreName);
    } else {
      this.selectedRestores.push(restoreName);
    }
  }

  onSelectAll(): void {
    this.selectAll = !this.selectAll;
    this.selectedRestores = this.selectAll ? this.dataSource.data.map((backup: any) => backup.name) : [];
  }

  checkSelected(backupName: string): boolean {
    if (this.selectedRestores.includes(backupName) || !this.selectedRestores.length) {
      return false;
    }
    return true;
  }

  onFilterChange(value: string): void {
    this.dataSource.data = this.data.filter(restore => restore.name.includes(value));
  }
  //
  //
  // note try to convert these two methods into one
  //
  //
  deleteRestore(restoreName: string): void {
    const config: MatDialogConfig = {
      data: {
        restoreNames: [restoreName],
      },
    };
    this._matDialog
      .open(DeleteRestoreDialogComponent, config)
      .afterClosed()
      .subscribe(res => {
        if (res) {
          const backups = JSON.parse(this._cookieService.get('restore') || '[]');
          const filteredBackups = backups.filter(restore => restore.name !== restoreName);
          this._cookieService.set('restore', JSON.stringify(filteredBackups));
        }
        this.dataSource.data = JSON.parse(this._cookieService.get('restore') || '[]');
      });
  }

  deleteRestores(restoreNames: string[]): void {
    const config: MatDialogConfig = {
      data: {
        restoreNames,
      },
    };
    this._matDialog
      .open(DeleteRestoreDialogComponent, config)
      .afterClosed()
      .subscribe(res => {
        this.selectedRestores = [];
        if (res) {
          const restores = JSON.parse(this._cookieService.get('restore') || '[]');
          const filteredRestores = restores.filter(restore => !restoreNames.includes(restore.name));
          this._cookieService.set('restore', JSON.stringify(filteredRestores));
        }
        this.dataSource.data = JSON.parse(this._cookieService.get('restore') || '[]');
      });
  }
}
