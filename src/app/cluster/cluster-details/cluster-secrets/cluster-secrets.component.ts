import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Subject} from 'rxjs';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {HealthEntity, HealthStatus} from '../../../shared/entity/HealthEntity';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';

@Component({
  selector: 'km-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss'],
})

export class ClusterSecretsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() health: HealthEntity;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;
  private _unsubscribe = new Subject<void>();

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, this.health);
    this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, this.health);
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
      return 'fa fa-circle orange';
    }
  }

  getIconClass(isHealthy: HealthStatus): string {
    switch (isHealthy) {
      case HealthStatus.up:
        return 'km-icon-running';
      case HealthStatus.down:
        return 'km-icon-failed';
      case HealthStatus.provisioning:
        return 'fa fa-circle orange';
      default:
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

  getHealthStatus(isHealthy: HealthStatus): string {
    if (isHealthy === HealthStatus.up) {
      return 'Running';
    } else {
      if (this.health.apiserver === HealthStatus.down) {
        return 'Failed';
      } else {
        return 'Pending';
      }
    }
  }
}
