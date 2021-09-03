import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MeteringService} from '@core/services/metering';
import {NotificationService} from '@core/services/notification';
import {pushToSide} from '@shared/animations/push';
import {MeteringConfiguration} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface MeteringConfigurationDialogConfig {
  configuration: MeteringConfiguration;
}

enum Controls {
  Enabled = 'enabled',
  StorageSize = 'storageSize',
  StorageClassName = 'storageClassName',
}

@Component({
  selector: 'km-metering-configuration-dialog',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  animations: [pushToSide],
})
export class MeteringConfigurationDialog implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  form: FormGroup;
  saving = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _matDialogRef: MatDialogRef<MeteringConfigurationDialog>,
    private readonly _meteringService: MeteringService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: MeteringConfigurationDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Enabled]: this._builder.control(this.data.configuration.enabled, Validators.required),
      [Controls.StorageSize]: this._builder.control(this.data.configuration.storageSize, Validators.required),
      [Controls.StorageClassName]: this._builder.control(this.data.configuration.storageClassName, Validators.required),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {
    this.saving = true;

    this._meteringService
      .saveConfiguration(this._toMeteringConfiguration())
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('Successfully updated metering configuration.');
        this._matDialogRef.close(true);
        this._meteringService.onConfigurationChange$.next();
        this.saving = false;
      });
  }

  private _toMeteringConfiguration(): MeteringConfiguration {
    return {
      enabled: this.form.get(Controls.Enabled).value,
      storageClassName: this.form.get(Controls.StorageClassName).value,
      storageSize: this.form.get(Controls.StorageSize).value,
    } as MeteringConfiguration;
  }
}
