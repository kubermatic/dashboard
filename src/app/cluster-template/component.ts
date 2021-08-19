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
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {ApiService} from '@core/services/api';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {Router} from '@angular/router';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {AppConfigService} from '@app/config.service';
import {ClusterTemplate} from "@shared/entity/cluster-template";
import {Datacenter} from "@shared/entity/datacenter";
import {DatacenterService} from "@core/services/datacenter";
import {CloudSpec, Cluster} from "@shared/entity/cluster";

@Component({
  selector: 'km-cluster-template',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterTemplateComponent implements OnInit, OnChanges, OnDestroy {
  clusterTemplates: ClusterTemplate[] = [];
  templateDatacenterMap: Map<string, Datacenter> = new Map<string, Datacenter>();
  isInitializing = true;
  currentUser: Member;
  displayedColumns: string[] = ['name', 'scope', 'provider', 'region', 'actions'];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private readonly _refreshTime = 10; // in seconds
  private _unsubscribe = new Subject<void>();
  private _membersUpdate = new Subject<void>();
  private _currentGroupConfig: GroupConfig;
  private _selectedProject: Project;

  constructor(
    private readonly _clusterTemplateService: ClusterTemplateService,
    private readonly _datacenterService: DatacenterService,
    private readonly _router: Router,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _matDialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _appConfig: AppConfigService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._setupList();

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.currentUser = user));

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          this._membersUpdate.next();
          return this._userService.getCurrentUserGroup(project.id);
        })
      )
      .pipe(take(1))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    merge(timer(0, this._refreshTime * this._appConfig.getRefreshTimeBase()), this._membersUpdate)
      .pipe(
        switchMap(() =>
          this._selectedProject ? this._clusterTemplateService.clusterTemplates(this._selectedProject.id) : EMPTY
        )
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusterTemplates => {
        this.clusterTemplates = clusterTemplates;
        this.dataSource.data = this.clusterTemplates;
        this.isInitializing = false;
        this._loadDatacenters();
      });
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

  private _loadDatacenters(): void {
    this.clusterTemplates.map(clusterTemplate => this._datacenterService
      .getDatacenter(clusterTemplate.cluster.spec.cloud.dc)
      .pipe(take(1))
      .subscribe(datacenter => this.templateDatacenterMap[clusterTemplate.id] = datacenter));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.clusterTemplates;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  isAddEnabled(): boolean {
    return MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Create);
  }

  createClusterTemplate(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`]);
  }

  isEditEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Edit) &&
      this.currentUser &&
      member &&
      this.currentUser.email !== member.email
    );
  }

  isDeleteEnabled(member: Member): boolean {
    return (
      MemberUtils.hasPermission(this.currentUser, this._currentGroupConfig, View.Members, Permission.Delete) &&
      this.currentUser &&
      member &&
      this.currentUser.email !== member.email
    );
  }

  delete(member: Member): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Cluster Template',
        message: `Delete ${member.name} member from the ${this._selectedProject.name} project?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('memberOverview', 'deleteMemberOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._apiService.deleteMembers(this._selectedProject.id, member)))
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(
          `The ${member.name} member was removed from the ${this._selectedProject.name} project`
        );
        this._googleAnalyticsService.emitEvent('memberOverview', 'MemberDeleted');
      });
  }

  getProvider(cloud: CloudSpec): string {
    return Cluster.getProvider(cloud);
  }

  isPaginatorVisible(): boolean {
    return (
      !_.isEmpty(this.clusterTemplates) && this.paginator && this.clusterTemplates.length > this.paginator.pageSize
    );
  }
}
