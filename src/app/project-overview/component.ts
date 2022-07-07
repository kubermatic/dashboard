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
import {catchError, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {combineLatest, EMPTY, iif, merge, of, onErrorResumeNext, Subject, timer} from 'rxjs';
import {Member} from '@shared/entity/member';
import {MemberService} from '@core/services/member';
import {AppConfigService} from '@app/config.service';
import {ClusterService} from '@core/services/cluster';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {SettingsService} from '@core/services/settings';
import {Cluster} from '@shared/entity/cluster';
import {ServiceAccount} from '@shared/entity/service-account';
import {ServiceAccountService} from '@core/services/service-account';
import {SSHKey} from '@shared/entity/ssh-key';
import {SSHKeyService} from '@core/services/ssh-key';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {BackupService} from '@core/services/backup';
import {EtcdBackupConfig} from '@shared/entity/backup';
import {Health} from '@shared/entity/health';
import {CookieService} from 'ngx-cookie-service';

@Component({
  selector: 'km-project-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProjectOverviewComponent implements OnInit, OnDestroy {
  project: Project;
  clusters: Cluster[] = [];
  clusterHealth: Health[] = [];
  externalClusters: ExternalCluster[] = [];
  externalClustersEnabled = false;
  clusterTemplates: ClusterTemplate[] = [];
  backups: EtcdBackupConfig[] = [];
  sshKeys: SSHKey[] = [];
  members: Member[] = [];
  serviceAccounts: ServiceAccount[] = [];
  clustersChange = new Subject<void>();
  externalClustersChange = new Subject<void>();
  clusterTemplatesChange = new Subject<void>();
  backupsChange = new Subject<void>();
  private _projectChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();
  private readonly _refreshTime = 15;
  firstVisitToOverviewPage: string;
  private readonly _cookieName = 'firstVisit';

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _backupService: BackupService,
    private readonly _sshKeyService: SSHKeyService,
    private readonly _memberService: MemberService,
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _settingsService: SettingsService,
    private readonly _appConfigService: AppConfigService,
    private readonly _cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this._loadProject();
    this._loadAdminSettings();
    this._loadClusters();
    this._loadExternalClusters();
    this._loadClusterTemplates();
    this._loadBackups();
    this._loadSSHKeys();
    this._loadMembers();
    this._loadServiceAccounts();
    this._checkFirstVisitToOverviewPageMessage();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _loadProject(): void {
    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe)).subscribe(p => {
      this.project = p;
      this._projectChange.next();
    });
  }

  private _loadAdminSettings(): void {
    this._settingsService.adminSettings
      .pipe(
        map(settings => settings.enableExternalClusterImport),
        takeUntil(this._unsubscribe)
      )
      .subscribe(externalClustersEnabled => (this.externalClustersEnabled = externalClustersEnabled));
  }

  private _loadClusters(): void {
    merge(
      timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()),
      this._projectChange,
      this.clustersChange
    )
      .pipe(
        switchMap(() => (this.project ? this._clusterService.clusters(this.project.id, true) : EMPTY)),
        tap(clusters => (this.clusters = clusters)),
        switchMap(clusters =>
          iif(
            () => clusters.length > 0,
            combineLatest([
              ...clusters.map(cluster =>
                this._clusterService
                  .health(this.project.id, cluster.id)
                  .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                  .pipe(tap(health => (this.clusterHealth[cluster.id] = health)))
              ),
            ]).pipe(take(1)),
            of([])
          )
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe();
  }

  private _loadExternalClusters(): void {
    merge(
      timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()),
      this._projectChange,
      this.externalClustersChange
    )
      .pipe(
        switchMap(() =>
          this.project && this.externalClustersEnabled ? this._clusterService.externalClusters(this.project.id) : EMPTY
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(externalClusters => (this.externalClusters = externalClusters));
  }

  private _loadClusterTemplates(): void {
    merge(
      timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()),
      this._projectChange,
      this.clusterTemplatesChange
    )
      .pipe(
        switchMap(() => (this.project ? this._clusterTemplateService.list(this.project.id) : EMPTY)),
        takeUntil(this._unsubscribe)
      )
      .subscribe(clusterTemplates => (this.clusterTemplates = clusterTemplates));
  }

  private _loadBackups(): void {
    merge(
      timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()),
      this._projectChange,
      this.backupsChange
    )
      .pipe(switchMap(() => (this.project ? this._backupService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(backups => (this.backups = backups));
  }

  private _loadSSHKeys(): void {
    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(switchMap(() => (this.project ? this._sshKeyService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(sshKeys => (this.sshKeys = sshKeys));
  }

  private _loadMembers(): void {
    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(switchMap(() => (this.project ? this._memberService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(members => (this.members = members));
  }

  private _loadServiceAccounts(): void {
    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(switchMap(() => (this.project ? this._serviceAccountService.get(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(serviceAccounts => (this.serviceAccounts = serviceAccounts));
  }

  private _checkFirstVisitToOverviewPageMessage(): void {
    this._cookieService.get(this._cookieName)
      ? this.hideFirstVisitToOverviewPageMessage()
      : this._cookieService.set(this._cookieName, 'visited', null, '/', 'localhost', false, 'Lax');
  }

  hideFirstVisitToOverviewPageMessage(): void {
    this.firstVisitToOverviewPage = this._cookieService.get(this._cookieName);
  }
}
