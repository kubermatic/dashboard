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
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
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
import {View} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {Health} from '@shared/entity/health';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {combineLatest, EMPTY, iif, of, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ClusterDeleteConfirmationComponent} from '../../details/cluster/cluster-delete-confirmation/component';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {getClusterHealthStatus, HealthStatus} from '@shared/utils/health-status';

@Component({
  selector: 'km-cluster-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterListComponent implements OnInit, OnChanges, OnDestroy {
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _etcdRestores: EtcdRestore[] = [];
  private _projectChange$ = new Subject<void>();
  readonly Permission = Permission;
  clusters: Cluster[] = [];
  isInitialized = false;
  nodeDC: Datacenter[] = [];
  health: Health[] = [];
  machineDeployments: MachineDeployment[][] = [];
  displayedColumns: string[] = ['status', 'name', 'labels', 'provider', 'region', 'created', 'actions'];
  dataSource = new MatTableDataSource<Cluster>();
  searchQuery: string;
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _router: Router,
    private readonly _datacenterService: DatacenterService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
    private readonly _machineDeploymentService: MachineDeploymentService,
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
      .pipe(
        switchMap(_ =>
          combineLatest([
            this._userService.getCurrentUserGroup(this._selectedProject.id),
            this._clusterService.restores(this._selectedProject.id),
          ])
        )
      )
      .pipe(
        tap(([userGroup, restores]) => {
          this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
          this._etcdRestores = restores;
        })
      )
      .pipe(switchMap(_ => this._clusterService.clusters(this._selectedProject.id)))
      .pipe(tap(clusters => (this.clusters = clusters)))
      .pipe(
        switchMap(clusters =>
          iif(
            () => clusters.length > 0,
            combineLatest([
              ...clusters.map(cluster =>
                combineLatest([
                  of(cluster),
                  this._datacenterService.getDatacenter(cluster.spec.cloud.dc).pipe(take(1)),
                  this._clusterService
                    .health(this._selectedProject.id, cluster.id)
                    .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                    .pipe(tap(health => (this.health[cluster.id] = health)))
                    .pipe(
                      switchMap(_ =>
                        Health.allHealthy(this.health[cluster.id])
                          ? this._machineDeploymentService.list(cluster.id, this._selectedProject.id)
                          : of([])
                      )
                    ),
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
          const machineDeployments = group[2];

          this.nodeDC[cluster.id] = datacenter;
          this.machineDeployments[cluster.id] = machineDeployments;
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
      } as AddClusterFromTemplateDialogData,
    };

    this._matDialog.open(AddClusterFromTemplateDialogComponent, config);
  }

  getHealthStatus(cluster: Cluster): HealthStatus {
    return getClusterHealthStatus(cluster, this.health[cluster.id]);
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

  isRestoring(clusterID: string): boolean {
    const matching = this._etcdRestores.filter(restore => restore.spec.clusterId === clusterID) || [];
    return matching.length > 0
      ? matching.some(
          restore =>
            restore.status.phase === EtcdRestorePhase.Started || restore.status.phase === EtcdRestorePhase.StsRebuilding
        )
      : false;
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
}
