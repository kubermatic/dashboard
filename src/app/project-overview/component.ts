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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Project} from '@shared/entity/project';
import {ProjectService} from '@core/services/project';
import {map, switchMap, takeUntil} from 'rxjs/operators';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {Member} from '@shared/entity/member';
import {MemberService} from '@core/services/member';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {SettingsService} from '@core/services/settings';
import {Cluster} from '@shared/entity/cluster';

@Component({
  selector: 'km-project-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProjectOverviewComponent implements OnInit, OnDestroy {
  project: Project;
  clusters: Cluster[] = [];
  externalClusters: ExternalCluster[] = [];
  externalClustersEnabled = false;
  members: Member[] = [];
  private _projectChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();
  private readonly _refreshTime = 10;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _memberService: MemberService,
    private readonly _settingsService: SettingsService,
    private readonly _appConfigService: AppConfigService
  ) {}

  ngOnInit(): void {
    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(p => {
      this.project = p;
      this._projectChange.next();
    });

    this._settingsService.adminSettings
      .pipe(
        map(settings => settings.enableExternalClusterImport),
        takeUntil(this._unsubscribe)
      )
      .subscribe(externalClustersEnabled => (this.externalClustersEnabled = externalClustersEnabled));

    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(
        switchMap(() => (this.project ? this._clusterService.clusters(this.project.id) : EMPTY)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(clusters => (this.clusters = clusters));

    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(
        switchMap(() =>
          this.project && this.externalClustersEnabled ? this._clusterService.externalClusters(this.project.id) : EMPTY
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(externalClusters => (this.externalClusters = externalClusters));

    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(switchMap(() => (this.project ? this._memberService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(members => (this.members = members));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
