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
import {
  AddClusterFromTemplateDialogComponent,
  AddClusterFromTemplateDialogData,
} from '@app/shared/components/add-cluster-from-template-dialog/component';
import {WizardMode} from '@app/wizard/types/wizard-mode';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {DatacenterService} from '@core/services/datacenter';
import {NotificationService} from '@core/services/notification';
import {PathParam} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Cluster} from '@shared/entity/cluster';
import {ClusterTemplate, ClusterTemplateScope} from '@shared/entity/cluster-template';
import {View} from '@shared/entity/common';
import {Datacenter} from '@shared/entity/datacenter';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {filter, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';

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
  displayedColumns: string[] = ['name', 'scope', 'provider', 'region', 'created', 'actions'];
  dataSource = new MatTableDataSource<any>();
  isGroupConfigLoading: boolean;
  projectViewOnlyToolTip =
    'You do not have permission to perform this action. Contact the project owner to change your membership role';
  clusterTemplateFragment = this._route.snapshot.fragment;

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild('quotaWidget') quotaWidget: TemplateRef<QuotaWidgetComponent>;

  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;
  private _unsubscribe = new Subject<void>();
  private _onChange = new Subject<void>();

  constructor(
    private readonly _ctService: ClusterTemplateService,
    private readonly _datacenterService: DatacenterService,
    private readonly _router: Router,
    private readonly _route: ActivatedRoute,
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _activeRoute: ActivatedRoute,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._setupList();
    this._loadUser();
    this._loadProject();
    this._loadUserGroup();
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
      .pipe(tap(project => (this._selectedProject = project)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => this._onChange.next());
  }

  private _loadUserGroup(): void {
    this.isGroupConfigLoading = true;
    this._onChange
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._selectedProject.id).pipe(take(1))))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => {
        this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup);
        this.isGroupConfigLoading = false;
      });
  }

  private _loadTemplates(): void {
    this._onChange
      .pipe(switchMap(_ => this._ctService.list(this._selectedProject.id)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.templates = templates;
        this.dataSource.data = this.templates;
        this.isInitializing = false;
        this._loadDatacenters();
        const createClusterFromTemplateID = window.history.state.createClusterFromTemplateID;
        if (createClusterFromTemplateID) {
          const clusterTemplate = this.templates.find((ct: ClusterTemplate) => ct.id === createClusterFromTemplateID);
          if (clusterTemplate) {
            this.createCluster(clusterTemplate);
            window.history.replaceState({createClusterFromTemplateID: null}, '');
          }
        }
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

  canEdit(template: ClusterTemplate): boolean {
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
          Permission.Edit
        );
    }
  }

  create(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`], {
      state: {mode: WizardMode.CreateClusterTemplate},
    });
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
        message: `Delete <b>${template.name}</b> cluster template permanently? The clusters created using this template will not be deleted.`,
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
        this._onChange.next();
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
    const config: MatDialogConfig = {
      data: {
        templateId: template.id,
        projectId: this._selectedProject.id,
        quotaWidget: this.quotaWidget,
      } as AddClusterFromTemplateDialogData,
    };

    this._matDialog.open(AddClusterFromTemplateDialogComponent, config);
  }

  editClusterTemplate(template: ClusterTemplate): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`], {
      queryParams: {clusterTemplateID: template.id},
      state: {mode: WizardMode.EditClusterTemplate},
    });
  }

  onActivate(component: QuotaWidgetComponent): void {
    const id = this._activeRoute.snapshot.paramMap.get(PathParam.ProjectID);
    component.showAsCard = false;
    this._projectService.onProjectChange.pipe(startWith({id}), takeUntil(this._unsubscribe)).subscribe(({id}) => {
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
}
