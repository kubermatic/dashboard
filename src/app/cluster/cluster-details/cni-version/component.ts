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

import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Cluster} from '@shared/entity/cluster';
import {CNIVersionDialog} from './cni-version-dialog/component';
import {coerce, lt} from 'semver';

@Component({
  selector: 'km-cni-version',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class CNIVersionComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() isClusterRunning = false;
  upgradeAvailable = false;
  versions: string[] = [];

  constructor(private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this.versions = Cluster.getCNIVersions(this.cluster.spec.cniPlugin.type);
    this.versions.forEach(version => {
      const isUpgrade = lt(coerce(this.cluster.spec.cniPlugin.version), coerce(version));
      this.upgradeAvailable = this.upgradeAvailable ? true : isUpgrade;
    });
  }

  isEnabled(): boolean {
    return this.isClusterRunning && this.versions.length > 1;
  }

  hasAvailableUpdates(): boolean {
    return this.upgradeAvailable && this.versions.length > 1;
  }

  changeCNIVersionDialog(): void {
    if (this.isEnabled()) {
      const dialogConfig: MatDialogConfig = {
        data: {
          cluster: this.cluster,
          cniVersions: this.versions,
          upgradeAvailable: this.upgradeAvailable,
        },
      };

      this._matDialog.open(CNIVersionDialog, dialogConfig);
    }
  }
}
