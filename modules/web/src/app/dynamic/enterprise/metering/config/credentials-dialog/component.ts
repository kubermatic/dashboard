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
import {MatDialogRef} from '@angular/material/dialog';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {NotificationService} from '@core/services/notification';
import {pushToSide} from '@shared/animations/push';
import {MeteringCredentials} from '@shared/entity/datacenter';
import {Observable, Subject} from 'rxjs';
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
    standalone: false
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

  getObservable(): Observable<void> {
    return this._meteringService.saveCredentials(this._toMeteringCredentials()).pipe(take(1));
  }

  onNext(): void {
    this._notificationService.success('Updated metering credentials');
    this._matDialogRef.close(true);
    this._meteringService.onCredentialsChange$.next();
    this.saving = false;
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
