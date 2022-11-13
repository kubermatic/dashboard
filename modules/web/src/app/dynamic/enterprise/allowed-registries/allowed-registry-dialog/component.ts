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
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {getIconClassForButton} from '@shared/utils/common';
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';
import {AllowedRegistry} from '../entity';
import {AllowedRegistriesService} from '../service';
import {DialogActionMode} from '@shared/types/common';

export interface AllowedRegistryDialogConfig {
  title: string;
  mode: DialogActionMode;
  confirmLabel: string;

  // Allowed Registry has to be specified only if dialog is used in the edit mode.
  allowedRegistry?: AllowedRegistry;
}

export enum Controls {
  Name = 'name',
  RegistryPrefix = 'registryPrefix',
}

@Component({
  selector: 'km-allowed-registry-dialog',
  templateUrl: './template.html',
})
export class AllowedRegistryDialog implements OnInit, OnDestroy {
  readonly controls = Controls;
  readonly Mode = DialogActionMode;
  form: FormGroup;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _matDialogRef: MatDialogRef<AllowedRegistryDialog>,
    private readonly _allowedRegistriesService: AllowedRegistriesService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: AllowedRegistryDialogConfig
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Name]: new FormControl(this.data.mode === this.Mode.Edit ? this.data.allowedRegistry.name : '', [
        Validators.required,
      ]),
      [Controls.RegistryPrefix]: new FormControl(
        this.data.mode === this.Mode.Edit ? this.data.allowedRegistry.spec.registryPrefix : '',
        [Validators.required]
      ),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  label(): string {
    switch (this.data.confirmLabel) {
      case this.Mode.Add:
        return 'Add Allowed Registry';
      case this.Mode.Edit:
        return 'Save Changes';
      default:
        return '';
    }
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  getObservable(): Observable<AllowedRegistry> {
    const allowedRegistry: AllowedRegistry = {
      name: this.form.get(Controls.Name).value,
      spec: {
        registryPrefix: this.form.get(Controls.RegistryPrefix).value,
      },
    };

    switch (this.data.mode) {
      case this.Mode.Add:
        return this._create(allowedRegistry);
      case this.Mode.Edit:
        return this._edit(allowedRegistry);
    }
  }

  onNext(allowedRegistry: AllowedRegistry): void {
    switch (this.data.mode) {
      case this.Mode.Add:
        this._matDialogRef.close(true);
        this._notificationService.success(`Created the ${allowedRegistry.name} allowed registry`);
        this._allowedRegistriesService.refreshAllowedRegistries();
        break;
      case this.Mode.Edit:
        this._matDialogRef.close(true);
        this._notificationService.success(`Updated the ${allowedRegistry.name} allowed registry`);
        this._allowedRegistriesService.refreshAllowedRegistries();
    }
  }

  private _create(allowedRegistry: AllowedRegistry): Observable<AllowedRegistry> {
    return this._allowedRegistriesService.createAllowedRegistry(allowedRegistry).pipe(take(1));
  }

  private _edit(allowedRegistry: AllowedRegistry): Observable<AllowedRegistry> {
    return this._allowedRegistriesService
      .patchAllowedRegistry(this.data.allowedRegistry.name, allowedRegistry)
      .pipe(take(1));
  }
}
