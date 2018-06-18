import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { ClusterEntity, Metrics } from '../../../shared/entity/ClusterEntity';
import { MatDialog } from '@angular/material';
import { RevokeAdminTokenComponent } from './revoke-admin-token/revoke-admin-token.component';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ClusterService, ApiService } from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-secrets',
  templateUrl: './cluster-secrets.component.html',
  styleUrls: ['./cluster-secrets.component.scss']
})
export class ClusterSecretsComponent implements OnInit, OnChanges {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public expand = false;
  public dialogRef: any;
  public isClusterRunning: boolean;
  public healthStatus: string;
  public metrics: Metrics[];
  public currentMachinesValue: number;
  public machinesChartData;
  public validData = false;

  constructor(public dialog: MatDialog,
              private clusterService: ClusterService,
              private api: ApiService) { }

  ngOnInit() {
    this.getMetrics();
  }

  drawMetrics() {
    const machinesData = [['', '']];
    for (const i in this.metrics) {
      if (this.metrics.hasOwnProperty(i)) {
        for (const j in this.metrics[i]) {
          if (this.metrics[i].hasOwnProperty(j)) {
            if (this.metrics[i][j].name === 'Machines') {
              if (this.metrics[i][j].value) {
                this.currentMachinesValue = this.metrics[i][j].value;
              } else {
                this.currentMachinesValue = 0;
              }
            }
            if (this.metrics[i][j].name === 'Machines (1h)') {
              for (const v in this.metrics[i][j].values) {
                if (this.metrics[i][j].values.hasOwnProperty(v)) {
                  this.validData = true;
                  machinesData.push(['', this.metrics[i][j].values[v]]);
                }
              }
            }
          }
        }
      }
    }
    this.machinesChartData = {
      chartType: 'LineChart',
      dataTable: machinesData,
      options: {
        title: 'Machines (1h)',
        titleTextStyle: {
          fontSize: 12,
        },
        legend: {
          position: 'none',
        },
        chartArea: {
          width: '90%',
          height: '75%'
        },
        vAxis: {
          viewWindow: {
            min: 0,
          },
          format: '#',
          gridlines: {
            count: 4,
          },
        },
      },
    };
  }

  ngOnChanges() {
    this.isClusterRunning = this.clusterService.isClusterRunning(this.cluster);
    this.healthStatus = this.clusterService.getClusterHealthStatus(this.cluster);
    this.getMetrics();
  }

  isExpand(expand: boolean) {
    this.expand = expand;
  }

  public decode(type: string): void {
    let data;
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
    } else {
      return;
    }
  }

  public getIcon(name: string): string {
    if (this.cluster.status.health) {
      switch (name) {
        case 'apiserver':
          return this.getIconClass(this.cluster.status.health.apiserver);
        case 'controller':
          return this.getIconClass(this.cluster.status.health.controller);
        case 'etcd':
          return this.getIconClass(this.cluster.status.health.etcd);
        case 'scheduler':
          return this.getIconClass(this.cluster.status.health.scheduler);
        case 'machineController':
          return this.getIconClass(this.cluster.status.health.machineController);
        default:
          return '';
      }
    } else {
      return 'fa fa-spin fa-circle-o-notch';
    }
  }

  public getIconClass(isHealthy: boolean): string {
    if (isHealthy) {
      return 'iconRunning';
    } else if (!(isHealthy)) {
      if (!this.cluster.status.health.apiserver) {
        return 'iconFailed';
      } else {
        return 'fa fa-spin fa-circle-o-notch';
      }
    } else {
      return '';
    }
  }

  public getStatus(name: string): string {
    if (this.cluster.status.health) {
      switch (name) {
        case 'apiserver':
          return this.getHealthStatus(this.cluster.status.health.apiserver);
        case 'controller':
          return this.getHealthStatus(this.cluster.status.health.controller);
        case 'etcd':
          return this.getHealthStatus(this.cluster.status.health.etcd);
        case 'scheduler':
          return this.getHealthStatus(this.cluster.status.health.scheduler);
        case 'machineController':
          return this.getHealthStatus(this.cluster.status.health.machineController);
        default:
          return '';
      }
    } else {
      return 'Pending';
    }
  }

  public getHealthStatus(isHealthy: boolean): string {
    if (isHealthy) {
      return 'Running';
    } else if (!isHealthy) {
      if (!this.cluster.status.health.apiserver) {
        return 'Failed';
      } else {
        return 'Pending';
      }
    } else {
      return '';
    }
  }

  public revokeAdminTokenDialog(): void {
    this.dialogRef = this.dialog.open(RevokeAdminTokenComponent);

    this.dialogRef.componentInstance.cluster = this.cluster;
    this.dialogRef.componentInstance.datacenter = this.datacenter;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

  getMetrics() {
    this.api.getMetrics(this.cluster.metadata.name, this.datacenter.metadata.name).subscribe(res => {
      this.metrics = res;
      this.drawMetrics();
    });
  }

}
