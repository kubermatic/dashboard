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
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {Cluster, ClusterPatch} from '@shared/entity/cluster';
import {Project} from '@shared/entity/project';
import {Observable, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

export interface CNIVersionDialogConfig {
  cluster: Cluster;
  cniVersions: string[];
  upgradeAvailable: boolean;
}

@Component({
  selector: 'km-cni-version-dialog',
  templateUrl: './template.html',
})
export class CNIVersionDialog implements OnInit, OnDestroy {
  selectedCNIVersion: string;
  project: Project;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _matDialogRef: MatDialogRef<CNIVersionDialog>,
    private readonly _notificationService: NotificationService,
    @Inject(MAT_DIALOG_DATA) public data: CNIVersionDialogConfig
  ) {}

  ngOnInit(): void {
    this.selectedCNIVersion = this.data.cniVersions[0] || '';

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(project => (this.project = project));
  }

  upgradeAvailable(): boolean {
    return this.data.upgradeAvailable;
  }

  getObservable(): Observable<Cluster> {
    const patch: ClusterPatch = {
      spec: {
        cniPlugin: {
          version: this.selectedCNIVersion,
        },
      },
    };

    return this._clusterService.patch(this.project.id, this.data.cluster.id, patch);
  }

  onNext(): void {
    this._notificationService.success(
      `Updating the CNI version to the ${this.selectedCNIVersion} for the ${this.data.cluster.name} cluster`
    );
    this._clusterService.onClusterUpdate.next();
    this._matDialogRef.close(true);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
