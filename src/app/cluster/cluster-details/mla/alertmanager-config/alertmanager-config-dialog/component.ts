// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MLAService} from '@core/services/mla';
import {NotificationService} from '@core/services/notification';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {getIconClassForButton} from '@shared/utils/common-utils';
import _ from 'lodash';
import {encode, decode} from 'js-base64';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface AlertmanagerConfigDialogData {
  title: string;
  projectId: string;
  clusterId: string;
  confirmLabel: string;

  // Alertmanager Config has to be specified only if dialog is used in the edit mode.
  alertmanagerConfig?: AlertmanagerConfig;
}

@Component({
  selector: 'km-alertmanager-config-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AlertmanagerConfigDialog implements OnInit, OnDestroy {
  spec = '';
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<AlertmanagerConfigDialog>,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: AlertmanagerConfigDialogData
  ) {}

  ngOnInit(): void {
    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isValid(): boolean {
    return !_.isEmpty(this.spec);
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  save(): void {
    const alertmanagerConfig: AlertmanagerConfig = {
      spec: {
        config: this._getSpec(),
      },
    };

    this._edit(alertmanagerConfig);
  }

  private _initProviderConfigEditor(): void {
    const spec = this.data.alertmanagerConfig.spec.config;
    if (!_.isEmpty(spec)) {
      this.spec = decode(spec);
    }
  }

  private _getSpec(): string {
    return encode(this.spec);
  }

  private _edit(alertmanagerConfig: AlertmanagerConfig): void {
    this._mlaService
      .putAlertmanagerConfig(this.data.projectId, this.data.clusterId, alertmanagerConfig)
      .pipe(take(1))
      .subscribe(_ => {
        this._matDialogRef.close(true);
        this._notificationService.success('The Alertmanager Config was updated');
        this._mlaService.refreshAlertmanagerConfig();
      });
  }
}
