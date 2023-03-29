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
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {OPAService} from '@core/services/opa';
import {NotificationService} from '@core/services/notification';
import {Cluster} from '@shared/entity/cluster';
import {GatekeeperConfig, GatekeeperConfigSpec} from '@shared/entity/opa';
import {DialogActionMode} from '@shared/types/common';
import {getIconClassForButton} from '@shared/utils/common';
import * as y from 'js-yaml';
import _ from 'lodash';
import {Observable, Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface GatekeeperConfigDialogData {
  title: string;
  projectId: string;
  cluster: Cluster;
  mode: DialogActionMode;
  confirmLabel: string;

  // Gatekeeper Config has to be specified only if dialog is used in the edit mode.
  gatekeeperConfig?: GatekeeperConfig;
}

@Component({
  selector: 'km-gatekeeper-config-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class GatekeeperConfigDialog implements OnInit, OnDestroy {
  readonly Mode = DialogActionMode;
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

  label(): string {
    switch (this.data.mode) {
      case this.Mode.Add:
        return 'Add Gatekeeper Config';
      case this.Mode.Edit:
        return 'Save Changes';
      default:
        return '';
    }
  }
  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  getObservable(): Observable<GatekeeperConfig> {
    const gatekeeperConfig: GatekeeperConfig = {
      spec: this._getSpec(),
    };

    switch (this.data.mode) {
      case this.Mode.Add:
        return this._create(gatekeeperConfig);
      case this.Mode.Edit:
        return this._edit(gatekeeperConfig);
    }
  }

  onNext(): void {
    this._matDialogRef.close(true);
    this._opaService.refreshGatekeeperConfig();
    switch (this.data.confirmLabel) {
      case this.Mode.Add:
        this._notificationService.success('Created the Gatekeeper config');
        break;
      case this.Mode.Edit:
        this._notificationService.success('Updated the Gatekeeper config');
        break;
    }
  }

  private _initProviderConfigEditor(): void {
    if (this.data.mode === this.Mode.Edit) {
      const spec = this.data.gatekeeperConfig.spec;
      if (!_.isEmpty(spec)) {
        this.spec = y.dump(spec);
      }
    }
  }

  private _getSpec(): GatekeeperConfigSpec {
    let spec = new GatekeeperConfigSpec();
    const raw = y.load(this.spec) as GatekeeperConfigSpec;
    if (!_.isEmpty(raw)) {
      spec = raw;
    }
    return spec;
  }

  private _create(gatekeeperConfig: GatekeeperConfig): Observable<GatekeeperConfig> {
    return this._opaService
      .createGatekeeperConfig(this.data.projectId, this.data.cluster.id, gatekeeperConfig)
      .pipe(take(1));
  }

  private _edit(gatekeeperConfig: GatekeeperConfig): Observable<GatekeeperConfig> {
    return this._opaService
      .patchGatekeeperConfig(this.data.projectId, this.data.cluster.id, gatekeeperConfig)
      .pipe(take(1));
  }
}
