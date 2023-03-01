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
import {UserService} from '@core/services/user';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {getOperatingSystem} from '@shared/entity/node';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {Member} from '@shared/entity/member';
import {GroupConfig} from '@shared/model/Config';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {MemberUtils, Permission} from '@shared/utils/member';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {ExternalMachineDeploymentService} from '@core/services/external-machine-deployment';
import {UpdateExternalClusterMachineDeploymentDialogComponent} from '@app/cluster/details/external-cluster/update-external-cluster-machine-deployment-dialog/component';
import {HealthStatus} from '@shared/utils/health-status';
import {View} from '@app/shared/entity/common';
import {NotificationService} from 'app/core/services/notification';

enum AKSNodePoolState {
  ProvisioningState = 'provisioningState',
  PowerState = 'powerState',
}

enum Column {
  Status = 'status',
  Name = 'name',
  ProvisioningState = 'provisioningState',
  PowerState = 'powerState',
  Replicas = 'replicas',
  Version = 'version',
  OS = 'os',
  Created = 'created',
  Actions = 'actions',
}

@Component({
  selector: 'km-external-machine-deployment-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ExternalMachineDeploymentListComponent implements OnInit, OnChanges, OnDestroy {
  readonly column = Column;
  @Input() cluster: ExternalCluster;
  @Input() machineDeployments: ExternalMachineDeployment[] = [];
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() isInitialized = false;
  @Output() machineDeploymentChange$ = new EventEmitter<ExternalMachineDeployment>();
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  dataSource = new MatTableDataSource<ExternalMachineDeployment>();
  displayedColumns: string[] = Object.values(Column);

  private _unsubscribe: Subject<void> = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _matDialog: MatDialog,
    private readonly _router: Router,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _externalMachineDeploymentService: ExternalMachineDeploymentService
  ) {}

  ngOnInit(): void {
    this._filterDisplayedColumn();
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
    this.dataSource.paginator = this.paginator;

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getHealthStatus(md: ExternalMachineDeployment): HealthStatus {
    return ExternalMachineDeployment.getHealthStatus(md);
  }

  getOperatingSystem(md: ExternalMachineDeployment): string {
    return getOperatingSystem(md.spec.template);
  }

  goToDetails(md: ExternalMachineDeployment): void {
    this._router.navigate([
      `/projects/${this.projectID}/${View.Clusters}/${View.ExternalClusters}/${this.cluster.id}/md/${md.id}`,
    ]);
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

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Edit);
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Delete);
  }

  updateMachineDeployment(md: ExternalMachineDeployment, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      data: {
        projectID: this.projectID,
        clusterID: this.cluster.id,
        machineDeployment: md,
        replicas: md.spec?.replicas,
        kubeletVersion: md.spec?.template?.versions?.kubelet,
      },
    };
    this._matDialog.open(UpdateExternalClusterMachineDeploymentDialogComponent, dialogConfig);
  }

  showDeleteDialog(md: ExternalMachineDeployment, event: Event): void {
    event.stopPropagation();
    this._externalMachineDeploymentService
      .showExternalMachineDeploymentDeleteDialog(this.projectID, this.cluster, md)
      .subscribe(_ => {});
  }

  addExternalMachineDeployment(): void {
    this._externalMachineDeploymentService
      .showCreateExternalClusterMachineDeploymentDialog(this.projectID, this.cluster)
      .subscribe((data: ExternalMachineDeployment) => {
        this._notificationService.success(`${data.name} Machine Deployment been created`);
      });
  }

  private _filterDisplayedColumn(): void {
    if (!this.cluster.cloud.aks) {
      this.displayedColumns = this.displayedColumns.filter(
        (column: string) => column !== AKSNodePoolState.ProvisioningState && column !== AKSNodePoolState.PowerState
      );
    }
  }
}
