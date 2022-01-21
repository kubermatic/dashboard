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
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {distinctUntilChanged, filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {Router} from '@angular/router';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {ClusterTemplate, ClusterTemplateScope} from '@shared/entity/cluster-template';
import {Datacenter} from '@shared/entity/datacenter';
import {DatacenterService} from '@core/services/datacenter';
import {Cluster} from '@shared/entity/cluster';
import {ClusterFromTemplateDialogComponent} from '@shared/components/cluster-from-template/component';

@Component({
  selector: 'km-cluster-template',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterTemplateComponent implements OnInit, OnChanges, OnDestroy {
  templates: ClusterTemplate[] = [];
  templateDatacenterMap: Map<string, Datacenter> = new Map<string, Datacenter>();
  isInitializing = true;
  currentUser: Member;
  displayedColumns: string[] = ['name', 'scope', 'provider', 'region', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;
  private _unsubscribe = new Subject<void>();
  private _refresh = new Subject<void>();

  constructor(
    private readonly _ctService: ClusterTemplateService,
    private readonly _datacenterService: DatacenterService,
    private readonly _router: Router,
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._setupList();
    this._loadUser();
    this._loadProject();
    this._loadTemplates();
  }

  ngOnChanges(): void {
    this.dataSource.data = this.templates;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _setupList(): void {
    this.dataSource.data = [];
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;
    });
  }

  private _loadUser(): void {
    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.currentUser = user));
  }

  private _loadProject(): void {
    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._refresh.next();
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(take(1))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  private _loadTemplates(): void {
    this._projectService.selectedProject
      .pipe(distinctUntilChanged((p: Project, q: Project) => p.id === q.id))
      .pipe(switchMap(project => this._ctService.list(project.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.templates = templates;
        this.dataSource.data = this.templates;
        this.isInitializing = false;
        this._loadDatacenters();
      });
  }

  private _loadDatacenters(): void {
    this.templates.map(template =>
      this._datacenterService
        .getDatacenter(template.cluster.spec.cloud.dc)
        .pipe(take(1))
        .subscribe(datacenter => (this.templateDatacenterMap[template.id] = datacenter))
    );
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  isEmpty(): boolean {
    return _.isEmpty(this.templates);
  }

  isPaginatorVisible(): boolean {
    return !this.isEmpty() && this.paginator && this.templates.length > this.paginator.pageSize;
  }

  getProvider(cluster: Cluster): string {
    return Cluster.getProvider(cluster);
  }

  canCreate(): boolean {
    return MemberUtils.hasPermission(
      this.currentUser,
      this._currentGroupConfig,
      View.ClusterTemplates,
      Permission.Create
    );
  }

  create(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`]);
  }

  canDelete(template: ClusterTemplate): boolean {
    switch (template.scope) {
      case ClusterTemplateScope.Global:
        return this.currentUser.isAdmin;
      case ClusterTemplateScope.User:
        return this.currentUser.isAdmin || this.currentUser.email === template.user;
      case ClusterTemplateScope.Project:
        return MemberUtils.hasPermission(
          this.currentUser,
          this._currentGroupConfig,
          View.ClusterTemplates,
          Permission.Delete
        );
    }
  }

  delete(template: ClusterTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Cluster Template',
        message: `Delete <b>${template.name}</b> cluster template permanently? All clusters created using this template will persist.`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._ctService.delete(this._selectedProject.id, template.id)))
      .pipe(take(1))
      .subscribe(() => {
        this._refresh.next();
        this._notificationService.success(`Deleting the ${template.name} cluster template`);
      });
  }

  canCreateCluster(): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.ClusterTemplates, Permission.View) &&
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Clusters, Permission.Create)
    );
  }

  createCluster(template: ClusterTemplate): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        template: template,
        projectID: this._selectedProject.id,
      },
    };

    this._matDialog.open(ClusterFromTemplateDialogComponent, dialogConfig);
  }
}
