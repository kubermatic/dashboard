//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2023 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ProjectService } from '@app/core/services/project';
import { BackupStorageLocation } from '@app/shared/entity/backup';
import { Project } from '@app/shared/entity/project';
import { HealthStatus, getClusterBackupHealthStatus } from '@app/shared/utils/health-status';
import { Subject, takeUntil } from 'rxjs';
import { AddBackupStorageLocationDialogComponent, AddBackupStorageLocationDialogConfig } from './add-dialog/component';

@Component({
  selector: 'km-backup-storage-locations-list',
  templateUrl: './template.html',
})
export class BackupStorageLocationsListComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  private _selectedProject: Project;
  dataSource = new MatTableDataSource<BackupStorageLocation>();
  backupStorageLocations: BackupStorageLocation[] = [];
  columns = ['status', 'name', 'bucket', 'region', 'created'];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
  ) {}
  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.direction = 'asc';
    this.sort.active = 'name';

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(project => {
      this._selectedProject = project
      this._getBackupStorageLocationList(project.id)
    })

  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getStatus(phase: string): HealthStatus {
    return getClusterBackupHealthStatus(phase);
  }

  addBackupStorageLocation(): void {
    const config: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id
      } as AddBackupStorageLocationDialogConfig
    }
    this._matDialog.open(AddBackupStorageLocationDialogComponent, config).afterClosed()
    .subscribe(bsl => {
      console.log(bsl);

    })

  }

  private _getBackupStorageLocationList(projectID: string): void {
    this.dataSource.data = this.backupStorageLocations
    console.log(projectID);

  }
}
