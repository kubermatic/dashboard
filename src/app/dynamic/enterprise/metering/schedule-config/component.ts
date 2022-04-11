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

import {Component, Input, ViewChild} from '@angular/core';
import {MeteringReportConfiguration} from '@shared/entity/datacenter';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatDialog} from '@angular/material/dialog';
import {filter, take} from 'rxjs';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {MeteringScheduleConfigDialog} from './schedule-config-dialog/component';

@Component({
  selector: 'km-metering-schedule-config',
  templateUrl: 'template.html',
})
export class MeteringScheduleConfigComponent {
  @Input() schedules: MeteringReportConfiguration[];
  readonly displayedColumns: string[] = ['name', 'schedule', 'interval', 'actions'];
  dataSource = new MatTableDataSource<MeteringReportConfiguration>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private readonly _meteringService: MeteringService, private readonly _matDialog: MatDialog) {}

  ngOnInit() {
    this.dataSource.data = this.schedules;

    this.dataSource.sort = this.sort;
  }

  create() {
    const dialog = this._matDialog.open(MeteringScheduleConfigDialog);
    dialog
      .afterClosed()
      .pipe(filter(confirmed => confirmed))
      .pipe(take(1))
      .subscribe();
  }

  remove(name: string) {
    this._meteringService
      .deleteScheduleConfiguration(name)
      .pipe(take(1))
      .subscribe(() => this._meteringService.onScheduleConfigurationChange$.next());
  }

  canDelete(_name: string): boolean {
    return true;
  }
}
