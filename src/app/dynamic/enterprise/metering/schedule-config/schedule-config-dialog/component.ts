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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs';

enum Controls {
  Name = 'name',
  Cron = 'cron',
  Group = 'group',
  Interval = 'interval',
}

enum DefaultSchuleOption {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

// enum DefaultSchedule {
//   Daily = '00 22 * * *',
//   Weekly = '00 22 * * 1',
//   Monthly = '00 22 1 * *',
// }

// enum DefaultScheduleInterval {
//   Daily = 1,
//   Weekly = 7,
//   Monthly = 30,
// }

@Component({
  selector: 'km-add-schedule-config-dialog',
  templateUrl: './template.html',
})
export class MeteringScheduleConfigDialog implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  readonly ScheduleOption = DefaultSchuleOption;
  form: FormGroup;

  constructor(private readonly _builder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', Validators.required),
      [Controls.Group]: this._builder.control(DefaultSchuleOption.Daily, Validators.required),
      [Controls.Cron]: this._builder.control('', Validators.required),
      [Controls.Interval]: this._builder.control('', Validators.required),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {}
}
