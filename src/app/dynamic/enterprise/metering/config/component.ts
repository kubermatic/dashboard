// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {
  MeteringConfigurationDialog,
  MeteringConfigurationDialogConfig,
} from '@app/dynamic/enterprise/metering/config/config-dialog/component';
import {MeteringCredentialsDialog} from '@app/dynamic/enterprise/metering/config/credentials-dialog/component';
import {MeteringConfiguration} from '@shared/entity/datacenter';

@Component({
  selector: 'km-metering-config',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class MeteringConfigComponent {
  @Input() config: MeteringConfiguration;

  constructor(private readonly _dialog: MatDialog) {}

  configureMetering(): void {
    this._dialog.open(MeteringConfigurationDialog, {
      data: {configuration: this.config} as MeteringConfigurationDialogConfig,
    });
  }

  configureCredentials(): void {
    this._dialog.open(MeteringCredentialsDialog);
  }
}
