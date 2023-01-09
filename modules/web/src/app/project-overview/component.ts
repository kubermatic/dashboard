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
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {MachineDeploymentStatus} from '@shared/entity/machine-deployment';
import {Project} from '@shared/entity/project';
import {ProjectService} from '@core/services/project';
import {getClusterMachinesCount} from '@shared/utils/cluster';
import {catchError, filter, map, switchMap, take, takeUntil, tap, startWith} from 'rxjs/operators';
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
import {View} from '@shared/entity/common';
import {MemberUtils, Permission} from '@shared/utils/member';
import {UserService} from '@core/services/user';
import {Group} from '@dynamic/enterprise/group/entity';
import {GroupService} from '@dynamic/enterprise/group/service';
import {GroupConfig} from '@shared/model/Config';
import {QuotaWidgetComponent} from '../dynamic/enterprise/quotas/quota-widget/component';
import {DynamicModule} from '../dynamic/module-registry';
import {QuotaService} from '../dynamic/enterprise/quotas/service';
import {Quota} from '@shared/entity/quota';
import {GlobalModule} from '@core/services/global/module';
import {PathParam, ParamsService} from '@core/services/params';

@Component({
  selector: 'km-project-overview',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ProjectOverviewComponent implements OnInit, OnDestroy {
  readonly View = View;
  project: Project;
  clusters: Cluster[] = [];
  clusterHealth: Health[] = [];
  clusterMachinesCount: Record<string, MachineDeploymentStatus> = {};
  externalClusters: ExternalCluster[] = [];
  externalClustersEnabled = false;
  clusterTemplates: ClusterTemplate[] = [];
  backups: EtcdBackupConfig[] = [];
  sshKeys: SSHKey[] = [];
  members: Member[] = [];
  groups: Group[] = [];
  currentUser: Member;
  serviceAccounts: ServiceAccount[] = [];
  clustersChange = new Subject<void>();
  externalClustersChange = new Subject<void>();
  clusterTemplatesChange = new Subject<void>();
  backupsChange = new Subject<void>();
  firstVisitToOverviewPage: string;
  projectQuota: Quota;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;
  isLoadingClusters = true;
  isLoadingExternalClusters = true;
  private _quotaWidgetComponent: QuotaWidgetComponent | null;
  private _quotaService: QuotaService;
  private _groupService: GroupService;
  private _projectChange = new Subject<void>();
  private _unsubscribe = new Subject<void>();
  private _unsubscribeLoadMembers = new Subject<void>();
  private _currentGroupConfig: GroupConfig;
  private readonly _refreshTime = 15;
  private readonly _cookieName = 'firstVisit';

  constructor(
    private readonly _userService: UserService,
    private readonly _projectService: ProjectService,
    private readonly _clusterService: ClusterService,
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _backupService: BackupService,
    private readonly _sshKeyService: SSHKeyService,
    private readonly _memberService: MemberService,
    private readonly _serviceAccountService: ServiceAccountService,
    private readonly _settingsService: SettingsService,
    private readonly _appConfigService: AppConfigService,
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _params: ParamsService,
    private readonly _cookieService: CookieService
  ) {
    if (this.isEnterpriseEdition) {
      this._quotaService = GlobalModule.injector.get(QuotaService);
      this._groupService = GlobalModule.injector.get(GroupService);
    }
  }

  ngOnInit(): void {
    this._initSubscriptions();
    this._loadData();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._unsubscribeLoadMembers.complete();
  }

  hideFirstVisitToOverviewPageMessage(): void {
    this.firstVisitToOverviewPage = this._cookieService.get(this._cookieName);
  }

  hasPermission(view: View): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, view, Permission.View);
  }

  onActivate(component: QuotaWidgetComponent): void {
    this._quotaWidgetComponent = component;
    component.projectId = this._currentProjectId;
    component.showQuotaWidgetDetails = true;
    component.showIcon = false;
  }

  private get _currentProjectId(): string {
    return this._params.get(PathParam.ProjectID);
  }

  private _initSubscriptions() {
    this._userService.currentUser.pipe(takeUntil(this._unsubscribe)).subscribe(user => (this.currentUser = user));
    merge(this._projectService.selectedProject, this._projectService.onProjectChange)
      .pipe(
        switchMap((project: Project) => {
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => {
        this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
      });

    this._projectService.onProjectChange.pipe(takeUntil(this._unsubscribe)).subscribe(_ => {
      this.isLoadingClusters = true;
      this.isLoadingExternalClusters = true;
    });
  }

  private _loadData() {
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

    if (this.isEnterpriseEdition) {
      this._loadGroups();
      this._loadProjectQuota();
    }
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
        switchMap(() => (this.project ? this._clusterService.clusters(this.project.id) : EMPTY)),
        tap(clusters => (this.clusters = clusters)),
        tap(_ => (this.isLoadingClusters = false)),
        switchMap(clusters =>
          iif(
            () => clusters.length > 0,
            combineLatest([
              ...clusters.map(cluster =>
                this._clusterService
                  .health(this.project.id, cluster.id)
                  .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                  .pipe(tap(health => (this.clusterHealth[cluster.id] = health)))
                  .pipe(tap(_ => this._loadClusterMachineDeployments(cluster)))
              ),
            ]).pipe(take(1)),
            of([])
          )
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe();
  }

  private _loadClusterMachineDeployments(cluster: Cluster): void {
    if (Health.allHealthy(this.clusterHealth[cluster.id]) && !cluster.deletionTimestamp) {
      this._machineDeploymentService
        .list(cluster.id, this.project.id)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe({
          next: machineDeployments => {
            this.clusterMachinesCount = {
              ...this.clusterMachinesCount,
              [cluster.id]: getClusterMachinesCount(machineDeployments),
            };
          },
        });
    }
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
        tap(_ => (this.isLoadingExternalClusters = false)),
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
      .pipe(filter(() => this.project && this.hasPermission(View.Members)))
      .pipe(switchMap(() => (this.project ? this._memberService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(members => (this.members = members));
  }

  private _loadGroups(): void {
    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(filter(() => this.project && this.hasPermission(View.Members)))
      .pipe(switchMap(() => (this.project ? this._groupService.list(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(groups => (this.groups = groups));
  }

  private _loadServiceAccounts(): void {
    merge(timer(0, this._refreshTime * this._appConfigService.getRefreshTimeBase()), this._projectChange)
      .pipe(switchMap(() => (this.project ? this._serviceAccountService.get(this.project.id) : EMPTY)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(serviceAccounts => (this.serviceAccounts = serviceAccounts));
  }

  private _loadProjectQuota(): void {
    this._projectService.onProjectChange
      .pipe(
        startWith({id: this._currentProjectId}),
        switchMap(({id}) => {
          if (this._quotaWidgetComponent) {
            this._quotaWidgetComponent.projectId = id;
          }

          return this.currentUser.isAdmin
            ? this._quotaService.quotas.pipe(map(quotas => quotas.find(({subjectName}) => subjectName === id)))
            : this._quotaService.getLiveProjectQuota(id);
        }),
        takeUntil(this._unsubscribe)
      )
      .subscribe(quota => {
        this.projectQuota = quota;
      });
  }

  private _checkFirstVisitToOverviewPageMessage(): void {
    this._cookieService.get(this._cookieName)
      ? this.hideFirstVisitToOverviewPageMessage()
      : this._cookieService.set(this._cookieName, 'visited', null, '/', window.location.hostname, false, 'Lax');
  }
}
