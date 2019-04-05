import {Component, Input, OnChanges, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {AddMachineNetworkComponent} from './add-machine-network/add-machine-network.component';
import {RevokeAdminTokenComponent} from './revoke-admin-token/revoke-admin-token.component';

@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss'],
})

export class ClusterSecretsComponent implements OnInit, OnChanges {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  projectID: string;
  userGroup: string;
  expand = false;
  dialogRef: any;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;
  health: HealthEntity;
  userGroupConfig: UserGroupConfig;

  constructor(
      public dialog: MatDialog, private api: ApiService, private appConfigService: AppConfigService,
      private readonly _projectService: ProjectService) {}

  ngOnInit(): void {
    this.projectID = this._projectService.project.id;
    this.userGroup = this._projectService.userGroup;
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
  }

  ngOnChanges(): void {
    this.api.getClusterHealth(this.cluster.id, this.datacenter.metadata.name, this._projectService.project.id)
        .subscribe((health) => {
          this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, health);
          this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, health);
          this.health = health;
        });
  }

  isExpand(expand: boolean): void {
    this.expand = expand;
  }

  decode(type: string): void {
    /* let data;
    let name;

    switch (type) {
      case 'root-ca-certificate':
        name = 'ca.crt';
        data = this.cluster.status.rootCA.cert;
        break;
      case 'apiserver-cert-certificate':
        data = this.cluster.status.apiserverCert.cert;
        name = 'apiserver.crt';
        break;
      case 'apiserver-kubelet-client-certificate':
        data = this.cluster.status.kubeletCert.cert;
        name = 'kubelet-client.crt';
        break;
      case 'ssh-apiserver-rsa-public':
        data = this.cluster.status.apiserverSshKey.publicKey;
        name = 'apiserver_id-rsa.pub';
        break;
      default:
        break;
    }

    if (data && name) {
      const blob = new Blob([atob(data)], { type: 'text/plain' });
      const a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {*/
    return;
    // }
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
        default:
          return '';
      }
    } else {
      return 'fa fa-spin fa-circle-o-notch';
    }
  }

  getIconClass(isHealthy: boolean): string {
    if (isHealthy) {
      return 'km-icon-running';
    } else if (!(isHealthy)) {
      if (!this.health.apiserver) {
        return 'km-icon-failed';
      } else {
        return 'fa fa-spin fa-circle-o-notch';
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
        case 'uccm':
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

  revokeAdminTokenDialog(): void {
    this.dialogRef = this.dialog.open(RevokeAdminTokenComponent);
    this.dialogRef.componentInstance.cluster = this.cluster;
    this.dialogRef.componentInstance.datacenter = this.datacenter;
    this.dialogRef.componentInstance.projectID = this.projectID;
  }
  addMachineNetwork(): void {
    this.dialogRef = this.dialog.open(AddMachineNetworkComponent);
    this.dialogRef.componentInstance.cluster = this.cluster;
    this.dialogRef.componentInstance.datacenter = this.datacenter;
    this.dialogRef.componentInstance.projectID = this.projectID;
  }
}
