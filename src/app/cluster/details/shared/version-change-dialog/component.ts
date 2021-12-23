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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ClusterService} from '@core/services/cluster';
import {EndOfLifeService} from '@core/services/eol';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {Cluster, ClusterPatch} from '@shared/entity/cluster';
import {ExternalCluster, ExternalClusterPatch} from '@shared/entity/external-cluster';
import {Project} from '@shared/entity/project';
import {Observable, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-version-change-dialog',
  templateUrl: './template.html',
})
export class VersionChangeDialogComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster | ExternalCluster;
  @Input() versions: string[] = [];
  @Input() hasVersionOptions = true;
  @Input() isClusterExternal = false;
  selectedVersion: string;
  project: Project;
  isMachineDeploymentUpgradeEnabled = false;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _dialogRef: MatDialogRef<VersionChangeDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _eolService: EndOfLifeService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService
  ) {}

  ngOnInit(): void {
    if (this.versions.length > 0) {
      this.selectedVersion = this.versions[this.versions.length - 1];
    }

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
    this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChangeDialogOpened');
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getPatch(): ClusterPatch | ExternalClusterPatch {
    return {spec: {version: this.selectedVersion}};
  }

  private _patch(): Observable<Cluster | ExternalCluster> {
    return this.isClusterExternal
      ? this._clusterService.patchExternalCluster(this.project.id, this.cluster.id, this._getPatch())
      : this._clusterService.patch(this.project.id, this.cluster.id, this._getPatch());
  }

  changeVersion(): void {
    this._patch()
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `The ${this.cluster.name} cluster is being updated to the ${this.selectedVersion} version`
        );

        this._googleAnalyticsService.emitEvent('clusterOverview', 'clusterVersionChanged');

        if (!this.isClusterExternal && this.isMachineDeploymentUpgradeEnabled) {
          this.upgradeMachineDeployments();
        }
      });

    this._dialogRef.close(true);
  }

  upgradeMachineDeployments(): void {
    this._clusterService
      .upgradeMachineDeployments(this.project.id, this.cluster.id, this.selectedVersion)
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `The machine deployments from the ${this.cluster.name} cluster are being updated to the ${this.selectedVersion} version`
        );
      });
  }

  isClusterDeprecated(): boolean {
    return (
      this._eolService.cluster.isAfter(this.cluster.spec.version) ||
      this._eolService.cluster.isBefore(this.cluster.spec.version)
    );
  }
}
