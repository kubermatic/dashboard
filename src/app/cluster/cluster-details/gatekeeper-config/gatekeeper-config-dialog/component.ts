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
import {OPAService} from '@core/services/opa';
import {NotificationService} from '@core/services/notification';
import {GatekeeperConfig, GatekeeperConfigSpec} from '@shared/entity/opa';
import {getIconClassForButton} from '@shared/utils/common-utils';
import {dump, load} from 'js-yaml';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface GatekeeperConfigDialogData {
  title: string;
  projectId: string;
  clusterId: string;
  mode: Mode;
  confirmLabel: string;

  // Gatekeeper Config has to be specified only if dialog is used in the edit mode.
  gatekeeperConfig?: GatekeeperConfig;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
}

@Component({
  selector: 'km-gatekeeper-config-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class GatekeeperConfigDialog implements OnInit, OnDestroy {
  spec = '';
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<GatekeeperConfigDialog>,
    private readonly _opaService: OPAService,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: GatekeeperConfigDialogData
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
    const gatekeeperConfig: GatekeeperConfig = {
      spec: this._getSpec(),
    };

    switch (this.data.mode) {
      case Mode.Add:
        return this._create(gatekeeperConfig);
      case Mode.Edit:
        return this._edit(gatekeeperConfig);
    }
  }

  private _initProviderConfigEditor(): void {
    if (this.data.mode === Mode.Edit) {
      const spec = this.data.gatekeeperConfig.spec;
      if (!_.isEmpty(spec)) {
        this.spec = dump(spec);
      }
    }
  }

  private _getSpec(): GatekeeperConfigSpec {
    let spec = new GatekeeperConfigSpec();
    const raw = load(this.spec) as GatekeeperConfigSpec;
    if (!_.isEmpty(raw)) {
      spec = raw;
    }
    return spec;
  }

  private _create(gatekeeperConfig: GatekeeperConfig): void {
    this._opaService
      .createGatekeeperConfig(this.data.projectId, this.data.clusterId, gatekeeperConfig)
      .pipe(take(1))
      .subscribe(_ => {
        this._matDialogRef.close(true);
        this._notificationService.success('The Gatekeeper Config was created');
        this._opaService.refreshGatekeeperConfig();
      });
  }

  private _edit(gatekeeperConfig: GatekeeperConfig): void {
    this._opaService
      .patchGatekeeperConfig(this.data.projectId, this.data.clusterId, gatekeeperConfig)
      .pipe(take(1))
      .subscribe(_ => {
        this._matDialogRef.close(true);
        this._notificationService.success('The Gatekeeper Config was updated');
        this._opaService.refreshGatekeeperConfig();
      });
  }
}
