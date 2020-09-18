// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY, forkJoin, of, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, filter, first, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import * as _ from 'lodash';

import {
  ApiService,
  ClusterService,
  DatacenterService,
  NotificationService,
  ProjectService,
  UserService,
} from '../../core/services';
import {CloudSpec, Cluster} from '../../shared/entity/cluster';
import {Datacenter} from '../../shared/entity/datacenter';
import {View} from '../../shared/entity/common';
import {Health} from '../../shared/entity/health';
import {Member} from '../../shared/entity/member';
import {MachineDeployment} from '../../shared/entity/machine-deployment';
import {Project} from '../../shared/entity/project';
import {GroupConfig} from '../../shared/model/Config';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';
import {MemberUtils, Permission} from '../../shared/utils/member-utils/member-utils';
import {ClusterDeleteConfirmationComponent} from '../cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';
import {ExternalClusterDataDialogComponent} from '../../shared/components/external-cluster-data-dialog/component';

@Component({
  selector: 'km-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
})
export class ClusterListComponent implements OnInit, OnChanges, OnDestroy {
  clusters: Cluster[] = [];
  isInitialized = true;
  nodeDC: Datacenter[] = [];
  health: Health[] = [];
  machineDeployments: MachineDeployment[][] = [];
  provider = [];
  displayedColumns: string[] = ['status', 'name', 'labels', 'provider', 'region', 'type', 'created', 'actions'];
  dataSource = new MatTableDataSource<Cluster>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<any> = new Subject();
  private _selectedProject = {} as Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _router: Router,
    private readonly _datacenterService: DatacenterService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
    private readonly _apiService: ApiService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._selectedProject.id = this._activeRoute.snapshot.paramMap.get('projectID');
    this.dataSource.data = this.clusters;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._projectService.selectedProject
      // Do not allow project refresh to fire clusters refresh unless project has been changed.
      .pipe(distinctUntilChanged((p: Project, q: Project) => p.id === q.id))
      .pipe(switchMap(project => this._clusterService.clusters(project.id)))
      .pipe(
        switchMap((clusters: Cluster[]) => {
          this.clusters = clusters;
          this.dataSource.data = this.clusters;
          this.isInitialized = false;

          return forkJoin(
            clusters
              .filter(cluster => !cluster.isExternal)
              .map(cluster => {
                return (
                  this._datacenterService
                    .getDatacenter(cluster.spec.cloud.dc)
                    .pipe(tap(datacenter => (this.nodeDC[cluster.id] = datacenter)))
                    .pipe(
                      switchMap(datacenter =>
                        this._clusterService.health(this._selectedProject.id, cluster.id, datacenter.spec.seed)
                      )
                    )
                    // We need to resume on error, otherwise subscription will be canceled and clusters will stop
                    // refreshing.
                    .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                    .pipe(tap(health => (this.health[cluster.id] = health)))
                    .pipe(
                      switchMap(_ =>
                        Health.allHealthy(this.health[cluster.id])
                          ? this._apiService.getMachineDeployments(
                              cluster.id,
                              this.nodeDC[cluster.id].spec.seed,
                              this._selectedProject.id
                            )
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

  ngOnChanges(): void {
    this.dataSource.data = this.clusters;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
        this._notificationService.success(`The <strong>${addedCluster.name}</strong> cluster was added`);
      });
  }

  navigateToCluster(cluster: Cluster): void {
    if (cluster.isExternal) {
      this._router.navigate([`/projects/${this._selectedProject.id}/clusters/external/${cluster.id}`]);
    } else {
      this._router.navigate([
        `/projects/${this._selectedProject.id}/dc/${this.nodeDC[cluster.id].spec.seed}/clusters/${cluster.id}`,
      ]);
    }
  }

  getProvider(cloud: CloudSpec): string {
    return Cluster.getProvider(cloud);
  }

  deleteClusterDialog(cluster: Cluster, event: Event): void {
    event.stopPropagation();

    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = cluster;
    modal.componentInstance.seed = this.nodeDC[cluster.id].spec.seed;
    modal.componentInstance.projectID = this._selectedProject.id;
  }

  disconnectClusterDialog(cluster: Cluster, event: Event): void {
    event.stopPropagation();

    this._clusterService.showDisconnectClusterDialog(cluster, this._selectedProject.id).subscribe(_ => {
      this._notificationService.success(`The <strong>${cluster.name}</strong> cluster was disconnected`);
    });
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.clusters) && this.paginator && this.clusters.length > this.paginator.pageSize;
  }

  showEOLWarning(element: Cluster): boolean {
    return (
      !!this.machineDeployments[element.id] &&
      this.machineDeployments[element.id].filter(md => !!md.spec.template.operatingSystem.containerLinux).length > 0
    );
  }

  trackByClusterID(cluster: Cluster): string {
    return cluster.id;
  }
}
