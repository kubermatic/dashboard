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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {MeteringReportConfiguration} from '@app/shared/entity/datacenter';
import {Subject, take} from 'rxjs';

export interface MeteringScheduleEditDialogConfig {
  title: string;
  scheduleName: string;
  schedule: string;
  interval: number;
}

enum Controls {
  Name = 'name',
  Schedule = 'schedule',
  Interval = 'interval',
}

@Component({
  selector: 'km-schedule-config-edit-dialog',
  templateUrl: './template.html',
})
export class MeteringScheduleEditDialog implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  form: FormGroup;

  constructor(
    private readonly _meteringService: MeteringService,
    private readonly _matDialogRef: MatDialogRef<MeteringScheduleEditDialog>,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: MeteringScheduleEditDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control(this.data.scheduleName, Validators.required),
      [Controls.Schedule]: this._builder.control(this.data.schedule, Validators.required),
      [Controls.Interval]: this._builder.control(this.data.interval, [Validators.min(1), Validators.required]),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  edit(): void {
    this._meteringService
      .updateScheduleConfiguration(this._toMeteringScheduleConfiguration())
      .pipe(take(1))
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._meteringService.onScheduleConfigurationChange$.next();
      });
  }

  private _toMeteringScheduleConfiguration(): MeteringReportConfiguration {
    return {
      name: this.form.get(Controls.Name).value,
      schedule: this.form.get(Controls.Schedule).value,
      interval: this.form.get(Controls.Interval).value,
    };
  }
}
