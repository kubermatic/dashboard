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

import {Component, OnChanges, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {ClusterService} from '@core/services/cluster';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {
  AddClusterFromTemplateDialogComponent,
  AddClusterFromTemplateDialogData,
} from '@shared/components/add-cluster-from-template-dialog/component';
import {EtcdRestore, EtcdRestorePhase} from '@shared/entity/backup';
import {Cluster} from '@shared/entity/cluster';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {View} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {Health} from '@shared/entity/health';
import {MachineDeploymentStatus} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {getClusterMachinesCount} from '@shared/utils/cluster';
import {HealthStatus, StatusIcon, getClusterHealthStatus} from '@shared/utils/health-status';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {EMPTY, Subject, combineLatest, iif, of, onErrorResumeNext} from 'rxjs';
import {catchError, distinctUntilChanged, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {QuotaWidgetComponent} from '../../../dynamic/enterprise/quotas/quota-widget/component';
import {ClusterDeleteConfirmationComponent} from '../../details/cluster/cluster-delete-confirmation/component';

enum Column {
  Status = 'status',
  Name = 'name',
  Provider = 'provider',
  Version = 'version',
  Region = 'region',
  Machines = 'machines',
  Created = 'created',
  Actions = 'actions',
}

@Component({
  selector: 'km-cluster-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ClusterListComponent implements OnInit, OnChanges, OnDestroy {
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _etcdRestores: EtcdRestore[] = [];
  private _projectChange$ = new Subject<void>();
  private _enableEtcdBackups = false;
  readonly Column = Column;
  readonly displayedColumns: string[] = Object.values(Column);
  readonly Permission = Permission;
  clusters: Cluster[] = [];
  projectClusterListErrorMessage: string;
  clusterTemplates: ClusterTemplate[] = [];
  isInitialized = false;
  nodeDC: Datacenter[] = [];
  health: Health[] = [];
  machinesCount: Record<string, MachineDeploymentStatus> = {};
  dataSource = new MatTableDataSource<Cluster>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('quotaWidget') quotaWidget: TemplateRef<QuotaWidgetComponent>;

  get isAdmin(): boolean {
    return this._user.isAdmin;
  }

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _router: Router,
    private readonly _datacenterService: DatacenterService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _settingsService: SettingsService,
    private readonly _clusterTemplateService: ClusterTemplateService
  ) {}

  ngOnInit(): void {
    this._selectedProject.id = this._activeRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this.dataSource.data = this.clusters;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filterPredicate = this._filter.bind(this);
    this.dataSource.filter = '';
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this._enableEtcdBackups = settings.enableEtcdBackup;
      this.getRestores();
      this._clusterService.refreshClusters();
    });

    this._projectChange$
      .pipe(
        tap(_ => {
          this.dataSource.data = [];
          this.isInitialized = false;
          this._loadClusterTemplates();
        })
      )
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._selectedProject.id)))
      .pipe(
        tap(userGroup => {
          this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
          this.getRestores();
        })
      )
      .pipe(switchMap(_ => this._clusterService.projectClusterList(this._selectedProject.id)))
      .pipe(
        tap(projectCluster => {
          this.projectClusterListErrorMessage = projectCluster.errorMessage;
          this.clusters = projectCluster.clusters;
        })
      )
      .pipe(
        switchMap(projectCluster =>
          iif(
            () => projectCluster.clusters.length > 0,
            combineLatest([
              ...projectCluster.clusters.map(cluster =>
                combineLatest([
                  of(cluster),
                  this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1)),
                  this._clusterService
                    .health(this._selectedProject.id, cluster.id)
                    .pipe(catchError(() => onErrorResumeNext(EMPTY))),
                ])
              ),
            ]).pipe(take(1)),
            of([])
          )
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(groups => {
        groups.forEach(group => {
          const cluster = group[0];
          const datacenter = group[1];
          const health = group[2];
          this.nodeDC[cluster.id] = datacenter;
          this.health[cluster.id] = health;
          this._loadMachineDeployments(cluster);
        });
        this.dataSource.data = this.clusters;
        this.isInitialized = true;
      });

    this._projectService.selectedProject
      // Do not allow project refresh to fire clusters refresh unless project has been changed.
      .pipe(distinctUntilChanged((p: Project, q: Project) => p.id === q.id))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._onProjectChange.bind(this));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.clusters;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  selectTemplate(): void {
    const config: MatDialogConfig = {
      data: {
        projectId: this._selectedProject.id,
        quotaWidget: this.quotaWidget,
      } as AddClusterFromTemplateDialogData,
    };

    this._matDialog.open(AddClusterFromTemplateDialogComponent, config);
  }

  getHealthStatus(cluster: Cluster): HealthStatus {
    return getClusterHealthStatus(cluster, this.health[cluster.id]);
  }

  getMDHealthStatus(cluster: Cluster): HealthStatus {
    const mdCount = this.machinesCount[cluster.id];
    if (
      mdCount &&
      mdCount.replicas === mdCount.availableReplicas &&
      mdCount.availableReplicas === mdCount.updatedReplicas
    ) {
      return new HealthStatus('Running', StatusIcon.Running);
    }
    return new HealthStatus('Updating', StatusIcon.Pending);
  }

  can(permission: Permission): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, permission);
  }

  loadWizard(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`]);
  }

  navigateToCluster(cluster: Cluster): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/clusters/${cluster.id}`]);
  }

  getProvider(cluster: Cluster): string {
    return Cluster.getProvider(cluster);
  }

  deleteClusterDialog(cluster: Cluster, event: Event): void {
    event.stopPropagation();

    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = cluster;
    modal.componentInstance.projectID = this._selectedProject.id;
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.clusters) && this.paginator && this.clusters.length > this.paginator.pageSize;
  }

  trackBy(cluster: Cluster): string {
    return cluster.id;
  }

  isEmpty(arr: any): boolean {
    return _.isEmpty(arr);
  }

  getRestores(): void {
    if (this._enableEtcdBackups) {
      this._clusterService
        .restores(this._selectedProject.id)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(restores => {
          this._etcdRestores = restores;
        });
    } else {
      this._etcdRestores = [];
    }
  }

  isRestoring(clusterID: string): boolean {
    const matching = this._etcdRestores.filter(restore => restore.spec.clusterId === clusterID) || [];
    return matching.length > 0
      ? matching.some(
          restore =>
            restore.status.phase === EtcdRestorePhase.Started || restore.status.phase === EtcdRestorePhase.StsRebuilding
        )
      : false;
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.showAsCard = false;
    component.collapsible = true;
    this._projectService.onProjectChange
      .pipe(startWith(this._selectedProject), takeUntil(this._unsubscribe))
      .subscribe(({id}) => {
        component.projectId = id;
      });
  }

  onActivateQuotaDetails(component: QuotaWidgetComponent): void {
    component.showQuotaWidgetDetails = true;
    component.showIcon = true;
    const id = this._activeRoute.snapshot.paramMap.get(PathParam.ProjectID);
    this._projectService.onProjectChange.pipe(startWith({id}), takeUntil(this._unsubscribe)).subscribe(({id}) => {
      component.projectId = id;
    });
  }

  private _filter(cluster: Cluster, query: string): boolean {
    query = query.toLowerCase();

    // Check name.
    if (cluster.name.toLowerCase().includes(query)) {
      return true;
    }

    // Check labels.
    if (cluster.labels) {
      let hasMatchingLabel = false;
      Object.keys(cluster.labels).forEach(key => {
        const value = cluster.labels[key];
        if (key.toLowerCase().includes(query) || value.toLowerCase().includes(query)) {
          hasMatchingLabel = true;
          return;
        }
      });
      if (hasMatchingLabel) {
        return true;
      }
    }

    // Check provider.
    if (Cluster.getProvider(cluster).includes(query)) {
      return true;
    }

    // Check region.
    const datacenter = this.nodeDC[cluster.id];
    return (
      !!datacenter &&
      (datacenter.spec.country.toLowerCase().includes(query) || datacenter.spec.location.toLowerCase().includes(query))
    );
  }

  private _onProjectChange(project: Project): void {
    this._selectedProject = project;
    this._projectChange$.next();
  }

  private _loadClusterTemplates(): void {
    this.clusterTemplates = [];
    this._clusterTemplateService
      .list(this._selectedProject.id)
      .pipe(takeUntil(this._unsubscribe))
      .pipe(takeUntil(this._projectChange$))
      .subscribe(templates => {
        this.clusterTemplates = templates;
      });
  }

  private _loadMachineDeployments(cluster: Cluster): void {
    if (Health.allHealthy(this.health[cluster.id], Cluster.getProvider(cluster)) && !cluster.deletionTimestamp) {
      this._machineDeploymentService
        .list(cluster.id, this._selectedProject.id)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe({
          next: machineDeployments => {
            this.machinesCount[cluster.id] = getClusterMachinesCount(machineDeployments);
          },
        });
    }
  }
}
