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

import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {MatLegacyPaginator as MatPaginator} from '@angular/material/legacy-paginator';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {Router} from '@angular/router';
import {NodeService} from '@core/services/node';
import {NotificationService} from '@core/services/notification';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {Cluster} from '@shared/entity/cluster';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {getOperatingSystem, getOperatingSystemLogoClass} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {switchMap, take, takeUntil} from 'rxjs/operators';
import {getMachineDeploymentHealthStatus, HealthStatus} from '@shared/utils/health-status';
import {QuotaWidgetComponent} from '@dynamic/enterprise/quotas/quota-widget/component';
import {Datacenter} from '@shared/entity/datacenter';
import {ClusterService} from '@core/services/cluster';
import {DialogModeService} from '@app/core/services/dialog-mode';

enum Column {
  Status = 'status',
  Name = 'name',
  Replicas = 'replicas',
  Version = 'version',
  OS = 'os',
  Created = 'created',
  Actions = 'actions',
}

@Component({
  selector: 'km-machine-deployment-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class MachineDeploymentListComponent implements OnInit, OnChanges, OnDestroy {
  readonly Column = Column;
  dataSource = new MatTableDataSource<MachineDeployment>();
  displayedColumns: string[] = Object.values(Column);
  @Input() cluster: Cluster;
  @Input() machineDeployments: MachineDeployment[] = [];
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() isInitialized = false;
  @Input() nodeDc: Datacenter;
  @Output() changeMachineDeployment = new EventEmitter<MachineDeployment>();
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  private _unsubscribe: Subject<void> = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _router: Router,
    private readonly _nodeService: NodeService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _node: NodeService,
    private readonly _clusterService: ClusterService,
    private readonly _notificationService: NotificationService,
    private readonly _isEditDialog: DialogModeService
  ) {}

  ngOnInit(): void {
    this._filterDisplayedColumn();
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
  }

  ngOnChanges(): void {
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get isAddMachineDeploymentsEnabled(): boolean {
    return (
      this.isClusterRunning &&
      MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Create)
    );
  }

  getHealthStatus(md: MachineDeployment): HealthStatus {
    return getMachineDeploymentHealthStatus(md);
  }

  getOperatingSystem(md: MachineDeployment): string {
    return getOperatingSystem(md.spec.template);
  }

  getOperatingSystemLogoClass(md: MachineDeployment): string {
    return `km-os-image-${getOperatingSystemLogoClass(md.spec.template)}`;
  }

  goToDetails(md: MachineDeployment): void {
    this._router.navigate(['/projects/' + this.projectID + '/clusters/' + this.cluster.id + /md/ + md.id]);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Edit);
  }

  showRestartDialog(md: MachineDeployment): void {
    this._nodeService
      .showMachineDeploymentRestartDialog(md, this.cluster, this.projectID, this.changeMachineDeployment)
      .subscribe(() => {});
  }

  showEditDialog(md: MachineDeployment): void {
    this._nodeService
      .showMachineDeploymentEditDialog(md, this.cluster, this.projectID)
      .pipe(take(1))
      .subscribe(
        _ => {
          this._notificationService.success(`Updated the ${md.name} machine deployment`);
          this.changeMachineDeployment.emit(md);
        },
        _ => this._notificationService.error(`Could not edit the ${md.name} machine deployment`)
      );

    this._isEditDialog.isEditDialog = true;
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Delete);
  }

  showDeleteDialog(md: MachineDeployment): void {
    this._nodeService
      .showMachineDeploymentDeleteDialog(md, this.cluster, this.projectID, this.changeMachineDeployment)
      .subscribe(() => {});
  }

  isPaginatorVisible(): boolean {
    return (
      !_.isEmpty(this.machineDeployments) && this.paginator && this.machineDeployments.length > this.paginator.pageSize
    );
  }

  isLoadingData(): boolean {
    return (_.isEmpty(this.machineDeployments) && !this.isClusterRunning) || !this.isInitialized;
  }

  hasNoData(): boolean {
    return _.isEmpty(this.machineDeployments) && this.isClusterRunning && this.isInitialized;
  }

  addNode(): void {
    this._node
      .showMachineDeploymentCreateDialog(this.cluster, this.projectID)
      .pipe(take(1))
      .subscribe({
        next: _ => this._clusterService.onClusterUpdate.next(),
        error: _ => this._notificationService.error('Could not create the machine deployment'),
      });
  }

  onActivate(component: QuotaWidgetComponent): void {
    component.projectId = this.projectID;
    component.showDetailsOnHover = true;
    component.showAsCard = false;
  }

  private _filterDisplayedColumn(): void {
    if (this.cluster.spec.cloud.aws) {
      this.displayedColumns = ['status', 'name', 'replicas', 'version', 'availabilityZone', 'os', 'created', 'actions'];
    }
  }
}
