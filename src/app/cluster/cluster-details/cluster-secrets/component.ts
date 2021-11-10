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
import {Health, HealthState} from '@shared/entity/health';
import {ClusterHealthStatus} from '@shared/utils/health-status/cluster-health-status';

@Component({
  selector: 'km-cluster-secrets',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterSecretsComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() health: Health;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    this.isClusterRunning = ClusterHealthStatus.isClusterAPIRunning(this.cluster, this.health);
    this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, this.health);
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
        case 'gatekeeperAudit':
          return this.getIconClass(this.health.gatekeeperAudit);
        case 'gatekeeperController':
          return this.getIconClass(this.health.gatekeeperController);
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
        case 'gatekeeperAudit':
          return this.getHealthStatus(this.health.gatekeeperAudit);
        case 'gatekeeperController':
          return this.getHealthStatus(this.health.gatekeeperController);
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
}
