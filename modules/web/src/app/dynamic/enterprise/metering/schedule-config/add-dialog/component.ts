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
import {NotificationService} from '@app/core/services/notification';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {MeteringReportConfiguration, MeteringReportType} from '@app/shared/entity/datacenter';
import {KmValidators} from '@app/shared/validators/validators';
import {Observable, Subject, take, takeUntil} from 'rxjs';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';

export interface MeteringScheduleAddDialogConfig {
  title: string;
}

enum Controls {
  Name = 'name',
  Schedule = 'schedule',
  Group = 'group',
  Interval = 'interval',
  Retention = 'retention',
  Types = 'types',
}

enum DefaultScheduleOption {
  Daily = 'daily',
  Weekly = 'weekly',
  Monthly = 'monthly',
  Custom = 'custom',
}

enum DefaultSchedule {
  Daily = '0 1 * * *',
  Weekly = '0 1 * * 6',
  Monthly = '0 1 1 * *',
}

enum DefaultScheduleInterval {
  Daily = 1,
  Weekly = 7,
  Monthly = 30,
}

enum DefaultReportRetentionOption {
  Daily = 30,
  Weekly = 90,
  Monthly = 365,
}

@Component({
    selector: 'km-add-schedule-config-dialog',
    templateUrl: './template.html',
    standalone: false
})
export class MeteringScheduleAddDialog implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  readonly ScheduleOption = DefaultScheduleOption;
  readonly reportTypes: MeteringReportType[] = Object.values(MeteringReportType);
  form: FormGroup;

  private get _group(): DefaultScheduleOption {
    return this.form.get(Controls.Group).value;
  }

  private get _retention(): number {
    switch (this._group) {
      case DefaultScheduleOption.Daily:
        return DefaultReportRetentionOption.Daily;
      case DefaultScheduleOption.Weekly:
        return DefaultReportRetentionOption.Weekly;
      case DefaultScheduleOption.Monthly:
        return DefaultReportRetentionOption.Monthly;
      case DefaultScheduleOption.Custom:
        return this.form.get(Controls.Retention).value;
    }
  }

  private get _schedule(): string {
    switch (this._group) {
      case DefaultScheduleOption.Daily:
        return DefaultSchedule.Daily;
      case DefaultScheduleOption.Weekly:
        return DefaultSchedule.Weekly;
      case DefaultScheduleOption.Monthly:
        return DefaultSchedule.Monthly;
      case DefaultScheduleOption.Custom:
        return this.form.get(Controls.Schedule).value;
    }
  }

  private get _interval(): number {
    switch (this._group) {
      case DefaultScheduleOption.Daily:
        return DefaultScheduleInterval.Daily;
      case DefaultScheduleOption.Weekly:
        return DefaultScheduleInterval.Weekly;
      case DefaultScheduleOption.Monthly:
        return DefaultScheduleInterval.Monthly;
      case DefaultScheduleOption.Custom:
        return this.form.get(Controls.Interval).value;
    }
  }

  constructor(
    private readonly _meteringService: MeteringService,
    private readonly _matDialogRef: MatDialogRef<MeteringScheduleAddDialog>,
    private readonly _builder: FormBuilder,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: MeteringScheduleAddDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Group]: this._builder.control(DefaultScheduleOption.Daily, Validators.required),
      [Controls.Schedule]: this._builder.control(DefaultSchedule.Daily),
      [Controls.Interval]: this._builder.control('1', Validators.min(1)),
      [Controls.Retention]: this._builder.control(null, Validators.min(1)),
      [Controls.Types]: this._builder.control(this.reportTypes, Validators.required),
    });

    this.form
      .get(Controls.Group)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onCustomScheduleChange.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<any> {
    return this._meteringService.addScheduleConfiguration(this._toMeteringScheduleConfiguration()).pipe(take(1));
  }

  onNext(): void {
    this._notificationService.success('Added schedule configuration');
    this._matDialogRef.close(true);
    this._meteringService.onScheduleConfigurationChange$.next();
  }

  private _onCustomScheduleChange(schedule: DefaultScheduleOption): void {
    this._updateFieldValidation(schedule === DefaultScheduleOption.Custom);
  }

  private _updateFieldValidation(required: boolean): void {
    if (required) {
      this.form.get(Controls.Schedule).setValidators([Validators.required, KmValidators.cronExpression()]);
      this.form.get(Controls.Interval).setValidators([Validators.required, Validators.min(1)]);
    } else {
      this.form.get(Controls.Schedule).clearValidators();
      this.form.get(Controls.Interval).setValidators(Validators.min(1));
    }

    this.form.get(Controls.Schedule).updateValueAndValidity();
    this.form.get(Controls.Interval).updateValueAndValidity();
  }

  private _toMeteringScheduleConfiguration(): MeteringReportConfiguration {
    const config = {
      name: this.form.get(Controls.Name).value,
      schedule: this._schedule,
      interval: this._interval,
      retention: this._retention,
    } as MeteringReportConfiguration;

    if (this._group === DefaultScheduleOption.Custom) {
      config.types = this.form.get(Controls.Types).value;
    }

    return config;
  }
}
