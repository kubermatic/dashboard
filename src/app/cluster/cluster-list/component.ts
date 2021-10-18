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

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {ApiService} from '@core/services/api';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {ExternalClusterDataDialogComponent} from '@shared/components/external-cluster-data-dialog/component';
import {SelectClusterTemplateDialogComponent} from '@shared/components/select-cluster-template/component';
import {EtcdRestore, EtcdRestorePhase} from '@shared/entity/backup';
import {CloudSpec, Cluster} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {Health} from '@shared/entity/health';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {AdminSettings} from '@shared/entity/settings';
import {GroupConfig} from '@shared/model/Config';
import {ClusterHealthStatus} from '@shared/utils/health-status/cluster-health-status';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {EMPTY, forkJoin, Observable, of, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ClusterDeleteConfirmationComponent} from '../cluster-details/cluster-delete-confirmation/component';

@Component({
  selector: 'km-cluster-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterListComponent implements OnInit, OnChanges, OnDestroy {
  clusters: Cluster[] = [];
  isInitialized = false;
  nodeDC: Datacenter[] = [];
  health: Health[] = [];
  machineDeployments: MachineDeployment[][] = [];
  provider = [];
  displayedColumns: string[] = ['status', 'name', 'labels', 'provider', 'region', 'created', 'actions'];
  dataSource = new MatTableDataSource<Cluster>();
  searchQuery: string;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _etcdRestores: EtcdRestore[] = [];
  private _projectChange$ = new Subject<void>();

  get adminSettings$(): Observable<AdminSettings> {
    return this._settingsService.adminSettings;
  }

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _router: Router,
    private readonly _datacenterService: DatacenterService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
    private readonly _apiService: ApiService,
    private readonly _notificationService: NotificationService,
    private readonly _settingsService: SettingsService
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

    this._settingsService.adminSettings
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._clusterService.refreshClusters());

    this._projectChange$
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._selectedProject.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._projectChange$
      .pipe(switchMap(_ => this._clusterService.restores(this._selectedProject.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(restores => (this._etcdRestores = restores));

    this._projectService.selectedProject
      // Do not allow project refresh to fire clusters refresh unless project has been changed.
      .pipe(distinctUntilChanged((p: Project, q: Project) => p.id === q.id))
      .pipe(tap(this._onProjectChange.bind(this)))
      .pipe(switchMap(project => this._clusterService.clusters(project.id)))
      .pipe(
        switchMap((clusters: Cluster[]) => {
          this.clusters = clusters;
          this.dataSource.data = this.clusters;
          this.isInitialized = true;

          return forkJoin(
            clusters
              .filter(cluster => !cluster.isExternal)
              .map(cluster => {
                return (
                  this._datacenterService
                    .getDatacenter(cluster.spec.cloud.dc)
                    .pipe(tap(datacenter => (this.nodeDC[cluster.id] = datacenter)))
                    .pipe(switchMap(_ => this._clusterService.health(this._selectedProject.id, cluster.id)))
                    // We need to resume on error, otherwise subscription will be canceled and clusters will stop
                    // refreshing.
                    .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                    .pipe(tap(health => (this.health[cluster.id] = health)))
                    .pipe(
                      switchMap(_ =>
                        Health.allHealthy(this.health[cluster.id])
                          ? this._apiService.getMachineDeployments(cluster.id, this._selectedProject.id)
                          : of([])
                      )
                    )
                    .pipe(tap(machineDeployments => (this.machineDeployments[cluster.id] = machineDeployments)))
                );
              })
          );
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe();
  }

  selectTemplate(): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        projectID: this._selectedProject.id,
      },
    };

    this._matDialog.open(SelectClusterTemplateDialogComponent, dialogConfig);
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

    // Following checks are only for internal clusters.
    if (cluster.isExternal) {
      return false;
    }

    // Check provider.
    if (Cluster.getProvider(cluster.spec.cloud).includes(query)) {
      return true;
    }

    // Check region.
    const datacenter = this.nodeDC[cluster.id];
    return (
      !!datacenter &&
      (datacenter.spec.country.toLowerCase().includes(query) || datacenter.spec.location.toLowerCase().includes(query))
    );
  }

  getHealthStatus(cluster: Cluster): ClusterHealthStatus {
    return ClusterHealthStatus.getHealthStatus(cluster, this.health[cluster.id]);
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Create);
  }

  canDelete(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Delete);
  }

  loadWizard(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`]);
  }

  connectCluster(): void {
    const dialog = this._matDialog.open(ExternalClusterDataDialogComponent);
    dialog.componentInstance.projectId = this._selectedProject.id;

    dialog
      .afterClosed()
      .pipe(filter(model => !!model))
      .pipe(switchMap(model => this._clusterService.addExternalCluster(this._selectedProject.id, model)))
      .pipe(take(1))
      .subscribe(addedCluster => {
        this._router.navigate([`/projects/${this._selectedProject.id}/clusters/external/${addedCluster.id}`]);
        this._notificationService.success(`The ${addedCluster.name} cluster was added`);
      });
  }

  navigateToCluster(cluster: Cluster): void {
    if (cluster.isExternal) {
      this._router.navigate([`/projects/${this._selectedProject.id}/clusters/external/${cluster.id}`]);
    } else {
      this._router.navigate([`/projects/${this._selectedProject.id}/clusters/${cluster.id}`]);
    }
  }

  getProvider(cloud: CloudSpec): string {
    return Cluster.getProvider(cloud);
  }

  deleteClusterDialog(cluster: Cluster, event: Event): void {
    event.stopPropagation();

    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = cluster;
    modal.componentInstance.projectID = this._selectedProject.id;
  }

  disconnectClusterDialog(cluster: Cluster, event: Event): void {
    event.stopPropagation();

    this._clusterService.showDisconnectClusterDialog(cluster, this._selectedProject.id).subscribe(_ => {
      this._notificationService.success(`The ${cluster.name} cluster was disconnected`);
    });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.clusters) && this.paginator && this.clusters.length > this.paginator.pageSize;
  }

  trackByClusterID(cluster: Cluster): string {
    return cluster.id;
  }

  isEmpty(arr: any): boolean {
    return _.isEmpty(arr);
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

  private _onProjectChange(project: Project): void {
    this._selectedProject = project;
    this._projectChange$.next();
  }
}
