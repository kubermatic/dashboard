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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {NodeService} from '@core/services/node';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {getOperatingSystem} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MachineDeploymentHealthStatus} from '@shared/utils/health-status/machine-deployment-health-status';
import {MemberUtils, Permission} from '@shared/utils/member-utils/member-utils';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-machine-deployment-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class MachineDeploymentListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: Cluster;
  @Input() machineDeployments: MachineDeployment[] = [];
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Output() changeMachineDeployment = new EventEmitter<MachineDeployment>();
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  dataSource = new MatTableDataSource<MachineDeployment>();
  displayedColumns: string[] = ['status', 'name', 'labels', 'replicas', 'ver', 'os', 'created', 'actions'];

  private _unsubscribe: Subject<void> = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _router: Router,
    private readonly _nodeService: NodeService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
    this.dataSource.paginator = this.paginator;

    this._userService.currentUser.subscribe(user => (this._user = user));

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .pipe(switchMap(project => this._userService.getCurrentUserGroup(project.id)))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    if (this.cluster.spec.cloud.aws) {
      this.displayedColumns = ['status', 'name', 'replicas', 'ver', 'availabilityZone', 'os', 'created', 'actions'];
    }
  }

  ngOnChanges(): void {
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHealthStatus(md: MachineDeployment): MachineDeploymentHealthStatus {
    return MachineDeploymentHealthStatus.getHealthStatus(md);
  }

  getOperatingSystem(md: MachineDeployment): string {
    return getOperatingSystem(md.spec.template);
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return Cluster.getVersionHeadline(type, isKubelet);
  }

  goToDetails(md: MachineDeployment): void {
    this._router.navigate(['/projects/' + this.projectID + '/clusters/' + this.cluster.id + /md/ + md.id]);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Edit);
  }

  showEditDialog(md: MachineDeployment): void {
    this._nodeService
      .showMachineDeploymentEditDialog(md, this.cluster, this.projectID)
      .pipe(take(1))
      .subscribe(
        _ => {
          this._notificationService.success(`The ${md.name} machine deployment was updated`);
          this.changeMachineDeployment.emit(md);
        },
        _ => this._notificationService.error('There was an error during machine deployment edition.')
      );
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Delete);
  }

  showDeleteDialog(md: MachineDeployment): void {
    this._nodeService
      .showMachineDeploymentDeleteDialog(md, this.cluster.id, this.projectID, this.changeMachineDeployment)
      .subscribe(() => {});
  }

  isPaginatorVisible(): boolean {
    return (
      !_.isEmpty(this.machineDeployments) && this.paginator && this.machineDeployments.length > this.paginator.pageSize
    );
  }

  isLoadingData(): boolean {
    return _.isEmpty(this.machineDeployments) && !this.isClusterRunning;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.machineDeployments) && this.isClusterRunning;
  }
}
