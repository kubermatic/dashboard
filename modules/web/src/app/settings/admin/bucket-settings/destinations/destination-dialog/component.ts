// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ChangeDetectionStrategy, Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {AdminSeed, BackupDestination, DestinationDetails, Destinations} from '@shared/entity/datacenter';
import {Observable, Subject} from 'rxjs';
import {KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@app/shared/validators/others';
import _ from 'lodash';

export interface DestinationDialogData {
  title: string;
  mode: Mode;
  seed: AdminSeed;

  // Destination has to be specified only if dialog is used in the edit mode.
  destination?: BackupDestination;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
}

export enum Controls {
  DestinationName = 'destinationName',
  Bucket = 'bucketName',
  Endpoint = 'endpoint',
  Default = 'default',
}

@Component({
  selector: 'km-destination-dialog',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestinationDialog implements OnInit, OnDestroy {
  readonly Controls = Controls;
  readonly Mode = Mode;
  form: FormGroup;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<DestinationDialog>,
    private readonly _datacenterService: DatacenterService,
    private readonly _notificationService: NotificationService,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: DestinationDialogData
  ) {}

  get currentDefault(): string {
    return this.data?.seed?.spec?.etcdBackupRestore?.defaultDestination;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.DestinationName]: this._builder.control(
        this.data.mode === Mode.Edit ? this.data.destination.destinationName : '',
        [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]
      ),
      [Controls.Bucket]: this._builder.control(this.data.mode === Mode.Edit ? this.data.destination.bucketName : '', [
        Validators.required,
      ]),
      [Controls.Endpoint]: this._builder.control(this.data.mode === Mode.Edit ? this.data.destination.endpoint : '', [
        Validators.required,
      ]),
      [Controls.Default]: this._builder.control(this._isDefault()),
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  label(): string {
    switch (this.data.mode) {
      case Mode.Add:
        return 'Add Destination';
      case Mode.Edit:
        return 'Save Changes';
    }
  }

  icon(): string {
    switch (this.data.mode) {
      case Mode.Add:
        return 'km-icon-add';
      case Mode.Edit:
        return 'km-icon-save';
    }
  }

  shouldDisplayWarning(): boolean {
    return !this._isDefault() && !!this.form.get(Controls.Default).value;
  }

  getObservable(): Observable<AdminSeed> {
    const destinationDetails: DestinationDetails = {
      [Controls.Bucket]: this.form.get(Controls.Bucket).value,
      [Controls.Endpoint]: this.form.get(Controls.Endpoint).value,
    };

    const destination: Destinations = _.cloneDeep(this.data.seed.spec.etcdBackupRestore?.destinations || {});
    destination[this.form.get(Controls.DestinationName).value] = destinationDetails;

    const configuration: AdminSeed = _.cloneDeep(this.data.seed);
    if (!configuration.spec.etcdBackupRestore) {
      configuration.spec.etcdBackupRestore = {destinations: {}, defaultDestination: ''};
    }

    configuration.spec.etcdBackupRestore.destinations = destination;

    if (this.form.get(Controls.Default).value) {
      configuration.spec.etcdBackupRestore.defaultDestination = this.form.get(Controls.DestinationName).value;
    }

    if (this._isDefault() && !this.form.get(Controls.Default).value) {
      configuration.spec.etcdBackupRestore.defaultDestination = '';
    }

    return this._datacenterService.patchAdminSeed(configuration.name, configuration);
  }

  onNext(): void {
    this._matDialogRef.close();
    this._notificationService.success(
      `${this.data.mode === Mode.Add ? 'Added' : ' Created'} the ${
        this.form.get(Controls.DestinationName).value
      } destination`
    );
    this._datacenterService.refreshAdminSeeds();
  }

  private _isDefault(): boolean {
    return !this._hasDefaultDestination() || this.currentDefault === this.data?.destination?.destinationName;
  }

  private _hasDefaultDestination(): boolean {
    return !!this.currentDefault;
  }
}
