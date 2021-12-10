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

import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {Cluster} from '@shared/entity/cluster';
import {Health, HealthState, HealthType} from '@shared/entity/health';
import {ClusterHealthStatus} from '@shared/utils/health-status/cluster-health-status';

@Component({
  selector: 'km-cluster-secrets',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterSecretsComponent implements OnInit {
  readonly HealthType = HealthType;
  @Input() cluster: Cluster;
  @Input() health: Health;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    this.isClusterRunning = ClusterHealthStatus.isClusterAPIRunning(this.cluster, this.health);
    this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, this.health);
  }

  getIcon(name: HealthType): string {
    if (this.health) {
      switch (name) {
        case HealthType.Apiserver:
          return this.getIconClass(this.health.apiserver);
        case HealthType.Controller:
          return this.getIconClass(this.health.controller);
        case HealthType.Etcd:
          return this.getIconClass(this.health.etcd);
        case HealthType.Scheduler:
          return this.getIconClass(this.health.scheduler);
        case HealthType.MachineController:
          return this.getIconClass(this.health.machineController);
        case HealthType.UserClusterControllerManager:
          return this.getIconClass(this.health.userClusterControllerManager);
        case HealthType.GatekeeperAudit:
          return this.getIconClass(this.health.gatekeeperAudit);
        case HealthType.GatekeeperController:
          return this.getIconClass(this.health.gatekeeperController);
        case HealthType.MlaGateway:
          return this.getIconClass(this.health.mlaGateway);
        case HealthType.AlertmanagerConfig:
          return this.getIconClass(this.health.alertmanagerConfig);
        case HealthType.Logging:
          return this.getIconClass(this.health.logging);
        case HealthType.Monitoring:
          return this.getIconClass(this.health.monitoring);
        default:
          return '';
      }
    } else {
      return 'km-icon-pending km-info';
    }
  }

  getIconClass(isHealthy: HealthState): string {
    switch (isHealthy) {
      case HealthState.up:
        return 'km-icon-running';
      case HealthState.down:
        return 'km-icon-failed';
      case HealthState.provisioning:
        return 'km-icon-pending km-info';
      default:
        return 'km-icon-pending km-info';
    }
  }

  getStatus(name: HealthType): string {
    if (this.health) {
      switch (name) {
        case HealthType.Apiserver:
          return this.getHealthStatus(this.health.apiserver);
        case HealthType.Controller:
          return this.getHealthStatus(this.health.controller);
        case HealthType.Etcd:
          return this.getHealthStatus(this.health.etcd);
        case HealthType.Scheduler:
          return this.getHealthStatus(this.health.scheduler);
        case HealthType.MachineController:
          return this.getHealthStatus(this.health.machineController);
        case HealthType.UserClusterControllerManager:
          return this.getHealthStatus(this.health.userClusterControllerManager);
        case HealthType.GatekeeperAudit:
          return this.getHealthStatus(this.health.gatekeeperAudit);
        case HealthType.GatekeeperController:
          return this.getHealthStatus(this.health.gatekeeperController);
        case HealthType.MlaGateway:
          return this.getHealthStatus(this.health.mlaGateway);
        case HealthType.AlertmanagerConfig:
          return this.getHealthStatus(this.health.alertmanagerConfig);
        case HealthType.Logging:
          return this.getHealthStatus(this.health.logging);
        case HealthType.Monitoring:
          return this.getHealthStatus(this.health.monitoring);
        default:
          return '';
      }
    } else {
      return 'Pending';
    }
  }

  getHealthStatus(isHealthy: HealthState): string {
    if (HealthState.isUp(isHealthy)) {
      return 'Running';
    }
    if (HealthState.isDown(this.health.apiserver)) {
      return 'Failed';
    }
    return 'Pending';
  }

  isOPAEnabled(): boolean {
    return !!this.cluster.spec.opaIntegration && this.cluster.spec.opaIntegration.enabled;
  }

  isMLAEnabled(): boolean {
    return !!this.isLoggingEnabled() || !!this.isMonitoringEnabled();
  }

  isLoggingEnabled(): boolean {
    return !!this.cluster?.spec?.mla?.loggingEnabled;
  }

  isMonitoringEnabled(): boolean {
    return !!this.cluster?.spec?.mla?.monitoringEnabled;
  }
}
