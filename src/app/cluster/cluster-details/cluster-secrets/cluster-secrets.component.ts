import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Subject} from 'rxjs';
import {mergeMap, switchMap, takeUntil} from 'rxjs/operators';

import {ClusterService, ProjectService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';

import {AddMachineNetworkComponent} from '../add-machine-network/add-machine-network.component';

@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss'],
})

export class ClusterSecretsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  projectID: string;
  dialogRef: any;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;
  health: HealthEntity;
  groupConfig: GroupConfig;

  private _unsubscribe = new Subject<void>();

  constructor(
      public dialog: MatDialog, private _clusterService: ClusterService,
      private readonly _projectService: ProjectService, private readonly _userService: UserService) {}

  ngOnInit(): void {
    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this.projectID = project.id;
          return this._userService.currentUserGroup(project.id);
        }))
        .pipe(mergeMap(userGroup => {
          this.groupConfig = this._userService.userGroupConfig(userGroup);
          return this._clusterService.health(this.projectID, this.cluster.id, this.datacenter.metadata.name);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((health) => {
          this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
          this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);
          this.health = health;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getIcon(name: string): string {
    if (this.health) {
      switch (name) {
        case 'apiserver':
          return this.getIconClass(this.health.apiserver);
        case 'controller':
          return this.getIconClass(this.health.controller);
        case 'etcd':
          return this.getIconClass(this.health.etcd);
        case 'scheduler':
          return this.getIconClass(this.health.scheduler);
        case 'machineController':
          return this.getIconClass(this.health.machineController);
        case 'userClusterControllerManager':
          return this.getIconClass(this.health.userClusterControllerManager);
        default:
          return '';
      }
    } else {
      return 'fa fa-circle';
    }
  }

  getIconClass(isHealthy: boolean): string {
    if (isHealthy) {
      return 'km-icon-running';
    } else if (!(isHealthy)) {
      if (!this.health.apiserver) {
        return 'km-icon-failed';
      } else {
        return 'fa fa-circle orange';
      }
    } else {
      return '';
    }
  }

  getStatus(name: string): string {
    if (this.health) {
      switch (name) {
        case 'apiserver':
          return this.getHealthStatus(this.health.apiserver);
        case 'controller':
          return this.getHealthStatus(this.health.controller);
        case 'etcd':
          return this.getHealthStatus(this.health.etcd);
        case 'scheduler':
          return this.getHealthStatus(this.health.scheduler);
        case 'machineController':
          return this.getHealthStatus(this.health.machineController);
        case 'userClusterControllerManager':
          return this.getHealthStatus(this.health.userClusterControllerManager);
        default:
          return '';
      }
    } else {
      return 'Pending';
    }
  }

  getHealthStatus(isHealthy: boolean): string {
    if (isHealthy) {
      return 'Running';
    } else {
      if (!this.health.apiserver) {
        return 'Failed';
      } else {
        return 'Pending';
      }
    }
  }

  addMachineNetwork(): void {
    this.dialogRef = this.dialog.open(AddMachineNetworkComponent);
    this.dialogRef.componentInstance.cluster = this.cluster;
    this.dialogRef.componentInstance.datacenter = this.datacenter;
    this.dialogRef.componentInstance.projectID = this.projectID;
  }
}
