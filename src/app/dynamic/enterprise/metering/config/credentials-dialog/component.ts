import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {NotificationService} from '@core/services/notification';
import {pushToSide} from '@shared/animations/push';
import {MeteringCredentials} from '@shared/entity/datacenter';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

enum Controls {
  AccessKey = 'accessKey',
  AccessSecret = 'accessSecret',
  BucketName = 'bucketName',
  Endpoint = 'endpoint',
}

@Component({
  selector: 'km-metering-credentials-dialog',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  animations: [pushToSide],
})
export class MeteringCredentialsDialog implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly controls = Controls;
  form: FormGroup;
  saving = false;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _matDialogRef: MatDialogRef<MeteringCredentialsDialog>,
    private readonly _meteringService: MeteringService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.AccessKey]: this._builder.control('', Validators.required),
      [Controls.AccessSecret]: this._builder.control('', Validators.required),
      [Controls.BucketName]: this._builder.control('', Validators.required),
      [Controls.Endpoint]: this._builder.control('', Validators.required),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  save(): void {
    this.saving = true;

    this._meteringService
      .saveCredentials(this._toMeteringCredentials())
      .pipe(take(1))
      .subscribe(_ => {
        this._notificationService.success('Successfully updated metering credentials.');
        this._matDialogRef.close(true);
        this._meteringService.onCredentialsChange$.next();
        this.saving = false;
      });
  }

  private _toMeteringCredentials(): MeteringCredentials {
    return {
      accessKey: this.form.get(Controls.AccessKey).value,
      secretKey: this.form.get(Controls.AccessSecret).value,
      bucketName: this.form.get(Controls.BucketName).value,
      endpoint: this.form.get(Controls.Endpoint).value,
    } as MeteringCredentials;
  }
}
