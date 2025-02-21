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
import {MatDialog} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ActivatedRoute, Router} from '@angular/router';
import {ExternalClusterDeleteConfirmationComponent} from '@app/cluster/details/external-cluster/external-cluster-delete-confirmation/component';
import {ClusterService} from '@core/services/cluster';
import {ExternalClusterService} from '@core/services/external-cluster';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {AddExternalClusterDialogComponent} from '@shared/components/add-external-cluster-dialog/component';
import {View} from '@shared/entity/common';
import {
  ExternalCloudSpec,
  ExternalCluster,
  ExternalClusterProvider,
  ExternalClusterState,
} from '@shared/entity/external-cluster';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {distinctUntilChanged, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';

enum Column {
  Status = 'status',
  Name = 'name',
  Provider = 'provider',
  Region = 'region',
  Imported = 'imported',
  Actions = 'actions',
}

@Component({
  selector: 'km-external-cluster-list',
  templateUrl: './template.html',
  standalone: false,
})
export class ExternalClusterListComponent implements OnInit, OnChanges, OnDestroy {
  readonly Permission = Permission;
  readonly Provider = ExternalClusterProvider;
  readonly Column = Column;
  readonly displayedColumns: string[] = Object.values(Column);
  clusters: ExternalCluster[] = [];
  isInitialized = false;
  dataSource = new MatTableDataSource<ExternalCluster>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('quotaWidget') quotaWidget: TemplateRef<QuotaWidgetComponent>;
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _selectedProject = {} as Project;
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _projectChange$ = new Subject<void>();

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _externalClusterService: ExternalClusterService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _router: Router,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _matDialog: MatDialog,
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
      .subscribe(_ => this._clusterService.refreshExternalClusters());

    this._projectChange$
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._selectedProject.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._projectService.selectedProject
      // Do not allow project refresh to fire clusters refresh unless project has been changed.
      .pipe(distinctUntilChanged((p: Project, q: Project) => p.id === q.id))
      .pipe(tap(this._onProjectChange.bind(this)))
      .pipe(switchMap(project => this._clusterService.externalClusters(project.id)))
      .pipe(
        map(clusters =>
          clusters.filter(cluster => ExternalCluster.getProvider(cluster.cloud) !== ExternalClusterProvider.KubeOne)
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusters => {
        this.clusters = clusters.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
        this.dataSource.data = this.clusters;
        this.isInitialized = true;
      });
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

  private _filter(cluster: ExternalCluster, query: string): boolean {
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
    return ExternalCluster.getProvider(cluster.cloud).includes(query);
  }

  can(permission: Permission): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, permission);
  }

  addExternalCluster(): void {
    const dialog = this._matDialog.open(AddExternalClusterDialogComponent);
    dialog.componentInstance.projectId = this._selectedProject.id;
    dialog.componentInstance.quotaWidget = this.quotaWidget;
  }

  canAccess(cluster: ExternalCluster): boolean {
    return (
      this.getProvider(cluster.cloud) !== ExternalClusterProvider.Custom ||
      cluster.status.state !== ExternalClusterState.Error
    );
  }

  navigateToCluster(cluster: ExternalCluster): void {
    if (this.canAccess(cluster)) {
      this._router.navigate([
        `/projects/${this._selectedProject.id}/${View.Clusters}/${View.ExternalClusters}/${cluster.id}`,
      ]);
    }
  }

  getProvider(cloud: ExternalCloudSpec): string {
    return ExternalCluster.getProvider(cloud);
  }

  getStatus(cluster: ExternalCluster): string {
    return ExternalCluster.getStatusMessage(cluster);
  }

  getStatusColor(cluster: ExternalCluster): string {
    return ExternalCluster.getStatusIcon(cluster);
  }

  isClusterDeleted(cluster: ExternalCluster): boolean {
    return ExternalCluster.isDeleted(cluster);
  }

  disconnectClusterDialog(cluster: ExternalCluster, event: Event): void {
    event.stopPropagation();
    this._externalClusterService.showDisconnectClusterDialog(cluster, this._selectedProject.id);
  }

  deleteClusterDialog(cluster: ExternalCluster, event: Event): void {
    event.stopPropagation();

    const modal = this._matDialog.open(ExternalClusterDeleteConfirmationComponent);
    modal.componentInstance.projectID = this._selectedProject.id;
    modal.componentInstance.cluster = cluster;
  }

  isPaginatorVisible(): boolean {
    return !_.isEmpty(this.clusters) && this.paginator && this.clusters.length > this.paginator.pageSize;
  }

  trackBy(cluster: ExternalCluster): string {
    return `${cluster.name}${cluster.creationTimestamp}`;
  }

  isEmpty(arr: any): boolean {
    return _.isEmpty(arr);
  }

  openWizard(): void {
    this._router.navigate(['projects', this._selectedProject.id, 'external-cluster-wizard']);
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.isExternalCluster = true;
    component.showAsCard = false;
    component.showDetailsOnHover = false;
    this._projectService.onProjectChange
      .pipe(startWith(this._selectedProject), takeUntil(this._unsubscribe))
      .subscribe(({id}) => {
        component.projectId = id;
      });
  }

  onActivateQuotaWidgetWithoutCard(component: QuotaWidgetComponent): void {
    component.isImportedCluster = true;
    component.showDetailsOnHover = false;
    component.showAsCard = false;
    this._projectService.onProjectChange
      .pipe(startWith(this._selectedProject), takeUntil(this._unsubscribe))
      .subscribe(({id}) => {
        component.projectId = id;
      });
  }

  getRegion(cloud: ExternalCloudSpec) {
    const provider = this.getProvider(cloud);
    switch (provider) {
      case ExternalClusterProvider.EKS:
        return cloud.eks.region;
      case ExternalClusterProvider.AKS:
        return cloud.aks.location;
      case ExternalClusterProvider.GKE:
        return cloud.gke.zone;
      default:
        return '';
    }
  }

  private _onProjectChange(project: Project): void {
    this._selectedProject = project;
    this._projectChange$.next();
  }
}
