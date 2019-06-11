import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {ProjectService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {ClusterHealthStatus} from '../../../shared/utils/health-status/cluster-health-status';
import {AddMachineNetworkComponent} from './add-machine-network/add-machine-network.component';
import {RevokeAdminTokenComponent} from './revoke-admin-token/revoke-admin-token.component';

@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss'],
})

export class ClusterSecretsComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() health: HealthEntity;
  projectID: string;
  expand = false;
  dialogRef: any;
  isClusterRunning: boolean;
  healthStatus: ClusterHealthStatus;
  groupConfig: GroupConfig;

  private _unsubscribe = new Subject<void>();

  constructor(
      public dialog: MatDialog, private readonly _projectService: ProjectService,
      private readonly _userService: UserService) {}

  ngOnInit(): void {
    this.isClusterRunning = ClusterHealthStatus.isClusterRunning(this.cluster, this.health);
    this.healthStatus = ClusterHealthStatus.getHealthStatus(this.cluster, this.health);

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this.projectID = project.id;
          return this._userService.currentUserGroup(project.id).pipe(first());
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(userGroup => {
          this.groupConfig = this._userService.userGroupConfig(userGroup);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
        return 'fa fa-circle';
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
