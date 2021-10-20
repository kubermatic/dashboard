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

import {ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ClusterService} from '@core/services/cluster';
import {EndOfLifeService} from '@core/services/eol';
import {Cluster, MasterVersion} from '@shared/entity/cluster';
import {gt, lt} from 'semver';
import {ChangeClusterVersionComponent} from '../change-cluster-version/component';
import {take} from 'rxjs/operators';

@Component({
  selector: 'km-version-picker',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class VersionPickerComponent implements OnInit, OnChanges {
  @Input() cluster: Cluster;
  @Input() isClusterRunning = false;
  @Input() upgrades: MasterVersion[] = [];
  versionsList: string[] = [];
  updatesAvailable = false;
  downgradesAvailable = false;
  someUpgradesRestrictedByKubeletVersion = false;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _matDialog: MatDialog,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _eolService: EndOfLifeService
  ) {}

  ngOnInit(): void {
    this.processData();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.processData();
  }

  processData(): void {
    this.versionsList = [];
    this.updatesAvailable = false;
    this.downgradesAvailable = false;
    this.someUpgradesRestrictedByKubeletVersion = false;

    this.upgrades.forEach(upgrade => {
      const isUpgrade = lt(this.cluster.spec.version, upgrade.version);
      const isDowngrade = gt(this.cluster.spec.version, upgrade.version);

      if (upgrade.restrictedByKubeletVersion === true) {
        this.someUpgradesRestrictedByKubeletVersion = isUpgrade;
        return; // Skip all restricted versions.
      }

      this.updatesAvailable = this.updatesAvailable ? true : isUpgrade;
      this.downgradesAvailable = this.downgradesAvailable ? true : isDowngrade;

      if (this.versionsList.indexOf(upgrade.version) < 0) {
        this.versionsList.push(upgrade.version);
      }
    });

    this._changeDetectorRef.detectChanges();
  }

  hasAvailableUpdates(): boolean {
    return this.updatesAvailable && !this._isClusterDeprecated();
  }

  isClusterBeforeEOL(): boolean {
    return this._eolService.cluster.isBefore(this.cluster.spec.version);
  }

  isClusterAfterEOL(): boolean {
    return this._eolService.cluster.isAfter(this.cluster.spec.version);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  isEnabled(): boolean {
    return this.isClusterRunning && (this.updatesAvailable || this.downgradesAvailable);
  }

  changeClusterVersionDialog(): void {
    if (this.isEnabled()) {
      const modal = this._matDialog.open(ChangeClusterVersionComponent);
      modal.componentInstance.cluster = this.cluster;
      modal.componentInstance.controlPlaneVersions = this.versionsList;
      modal
        .afterClosed()
        .pipe(take(1))
        .subscribe(isChanged => {
          if (isChanged) {
            this._clusterService.onClusterUpdate.next();
          }
        });
    }
  }

  private _isClusterDeprecated(): boolean {
    return (
      this._eolService.cluster.isAfter(this.cluster.spec.version) ||
      this._eolService.cluster.isBefore(this.cluster.spec.version)
    );
  }
}
