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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MeteringService} from '@app/dynamic/enterprise/metering/service/metering';
import {NotificationService} from '@core/services/notification';
import {pushToSide} from '@shared/animations/push';
import {MeteringConfiguration} from '@shared/entity/datacenter';
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';

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
    standalone: false
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
      [Controls.StorageClassName]: this._builder.control(this.data.configuration.storageClassName, [
        Validators.required,
        KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR,
      ]),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<void> {
    return this._meteringService.saveConfiguration(this._toMeteringConfiguration()).pipe(take(1));
  }

  onNext(): void {
    this._notificationService.success('Updated metering configuration');
    this._matDialogRef.close(true);
    this._meteringService.onConfigurationChange$.next();
    this.saving = false;
  }

  private _toMeteringConfiguration(): MeteringConfiguration {
    return {
      enabled: this.form.get(Controls.Enabled).value,
      storageClassName: this.form.get(Controls.StorageClassName).value,
      storageSize: this.form.get(Controls.StorageSize).value,
    } as MeteringConfiguration;
  }
}
