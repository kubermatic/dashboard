// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import {Router} from '@angular/router';
import {View} from '@app/shared/entity/common';
import {UserService} from '@core/services/user';
import {ExternalCluster} from '@shared/entity/external-cluster';
import {ExternalMachineDeployment} from '@shared/entity/external-machine-deployment';
import {Member} from '@shared/entity/member';
import {getOperatingSystem} from '@shared/entity/node';
import {GroupConfig} from '@shared/model/Config';
import {getMachineDeploymentHealthStatus, HealthStatus} from '@shared/utils/health-status';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

enum Column {
  Status = 'status',
  Name = 'name',
  Replicas = 'replicas',
  Version = 'version',
  OS = 'os',
  Created = 'created',
}

@Component({
  selector: 'km-kubeone-machine-deployment-list',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class KubeOneMachineDeploymentListComponent implements OnInit, OnChanges, OnDestroy {
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

  constructor(private readonly _router: Router, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this.dataSource.data = this.machineDeployments ? this.machineDeployments : [];
    this.dataSource.paginator = this.paginator;

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;
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
    return getMachineDeploymentHealthStatus(md);
  }

  getOperatingSystem(md: ExternalMachineDeployment): string {
    return getOperatingSystem(md.spec.template);
  }

  goToDetails(md: ExternalMachineDeployment): void {
    this._router.navigate([
      `/projects/${this.projectID}/${View.Clusters}/${View.KubeOneClusters}/${this.cluster.id}/md/${md.id}`,
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
}
