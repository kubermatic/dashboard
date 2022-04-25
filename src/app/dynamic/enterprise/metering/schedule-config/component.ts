//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2020 Kubermatic GmbH
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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MeteringReportConfiguration} from '@shared/entity/datacenter';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {filter, switchMap, take} from 'rxjs';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {MeteringScheduleAddDialog} from '@app/dynamic/enterprise/metering/schedule-config/add-dialog/component';
import {MeteringScheduleEditDialog} from '@app/dynamic/enterprise/metering/schedule-config/edit-dialog/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {NotificationService} from '@core/services/notification';
import {Router} from '@angular/router';

@Component({
  selector: 'km-metering-schedule-config',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class MeteringScheduleConfigComponent implements OnInit {
  @Input() schedules: MeteringReportConfiguration[];
  readonly displayedColumns: string[] = ['name', 'schedule', 'interval', 'actions'];
  dataSource = new MatTableDataSource<MeteringReportConfiguration>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(
    private readonly _meteringService: MeteringService,
    private readonly _matDialog: MatDialog,
    private readonly _router: Router,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.schedules;
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(): void {
    this.dataSource.data = this.schedules;
  }

  goToDetails(configName: string): void {
    this._router.navigate([`/settings/metering/schedule/${configName}`]);
  }

  create(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Add Schedule Configuration',
      },
    };
    this._matDialog.open(MeteringScheduleAddDialog, dialogConfig);
  }

  edit(config: MeteringReportConfiguration): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Edit Schedule Configuration',
        scheduleName: config.name,
        schedule: config.schedule,
        interval: config.interval,
      },
    };
    this._matDialog.open(MeteringScheduleEditDialog, dialogConfig);
  }

  remove(name: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Schedule Configuration',
        message: `Delete <b>${name}</b> schedule permanently?`,
        confirmLabel: 'Delete',
        warning: 'Deleting this will NOT remove reports related to it.',
      },
    };
    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._meteringService.deleteScheduleConfiguration(name)))
      .pipe(take(1))
      .subscribe(() => {
        this._meteringService.onScheduleConfigurationChange$.next();
        this._notificationService.success(`Deleting the ${name} configuration`);
      });
  }
}
