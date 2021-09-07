import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {getIconClassForButton} from '@shared/utils/common-utils';
import {AllowedRegistry} from '../entity';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';
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
        this._notificationService.success(`The allowed registry ${result.name} was created`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }

  private _edit(allowedRegistry: AllowedRegistry): void {
    this._allowedRegistriesService
      .patchAllowedRegistry(this.data.allowedRegistry.name, allowedRegistry)
      .pipe(take(1))
      .subscribe(result => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The allowed registry ${result.name} was updated`);
        this._allowedRegistriesService.refreshAllowedRegistries();
      });
  }
}
