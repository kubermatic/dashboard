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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {AdminSeed, BackupDestination, DestinationDetails, Destinations} from '@shared/entity/datacenter';
import {getIconClassForButton} from '@shared/utils/common-utils';
import {Subject} from 'rxjs';

export interface DestinationDialogData {
  title: string;
  mode: Mode;
  confirmLabel: string;
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
        [Validators.required]
      ),
      [Controls.Bucket]: this._builder.control(this.data.mode === Mode.Edit ? this.data.destination.bucketName : '', [
        Validators.required,
      ]),
      [Controls.Endpoint]: this._builder.control(this.data.mode === Mode.Edit ? this.data.destination.endpoint : '', [
        Validators.required,
      ]),
      [Controls.Default]: this._builder.control(
        this.data.mode === Mode.Edit && this.currentDefault === this.data.destination.destinationName
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
    const destinationDetails: DestinationDetails = {
      [Controls.Bucket]: this.form.get(Controls.Bucket).value,
      [Controls.Endpoint]: this.form.get(Controls.Endpoint).value,
    };

    const destination: Destinations = this.data.seed.spec.etcdBackupRestore.destinations;
    destination[this.form.get(Controls.DestinationName).value] = destinationDetails;

    const configuration: AdminSeed = this.data.seed;
    configuration.spec.etcdBackupRestore.destinations = destination;

    if (this.form.get(Controls.Default).value) {
      configuration.spec.etcdBackupRestore.defaultDestination = this.form.get(Controls.DestinationName).value;
    }

    this._datacenterService.patchAdminSeed(configuration.name, configuration).subscribe(_ => {
      this._matDialogRef.close();
      this._notificationService.success(this._notificationMessage());
      this._datacenterService.refreshAdminSeeds();
    });
  }

  private _notificationMessage(): string {
    switch (this.data.mode) {
      case Mode.Add:
        return 'Destination was successfully added';
      case Mode.Edit:
        return 'Destination was successfully edited';
    }
  }
}
