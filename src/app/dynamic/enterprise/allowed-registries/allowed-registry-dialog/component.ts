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
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';
import {AllowedRegistry} from '../entity';
import {AllowedRegistriesService} from '../service';

export interface AllowedRegistryDialogConfig {
  title: string;
  mode: Mode;
  confirmLabel: string;

  // Allowed Registry has to be specified only if dialog is used in the edit mode.
  allowedRegistry?: AllowedRegistry;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
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
  readonly Mode = Mode;
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
      [Controls.Name]: new FormControl(this.data.mode === Mode.Edit ? this.data.allowedRegistry.name : '', [
        Validators.required,
      ]),
      [Controls.RegistryPrefix]: new FormControl(
        this.data.mode === Mode.Edit ? this.data.allowedRegistry.spec.registryPrefix : '',
        [Validators.required]
      ),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  save(): void {
    const allowedRegistry: AllowedRegistry = {
      name: this.form.get(Controls.Name).value,
      spec: {
        registryPrefix: this.form.get(Controls.RegistryPrefix).value,
      },
    };

    switch (this.data.mode) {
      case Mode.Add:
        return this._create(allowedRegistry);
      case Mode.Edit:
        return this._edit(allowedRegistry);
    }
  }

  private _create(allowedRegistry: AllowedRegistry): void {
    this._allowedRegistriesService
      .createAllowedRegistry(allowedRegistry)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`Created the ${result.name} allowed registry`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }

  private _edit(allowedRegistry: AllowedRegistry): void {
    this._allowedRegistriesService
      .patchAllowedRegistry(this.data.allowedRegistry.name, allowedRegistry)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`Updated the ${result.name} allowed registry`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }
}
