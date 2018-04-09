import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity, Health } from '../../../shared/entity/ClusterEntity';
import { ClusterService } from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss'],
})
export class ClusterItemComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() index: number;
  @Input() health: Health;
  public nodeDC: DataCenterEntity;

  constructor(private dcService: DatacenterService, public clusterService: ClusterService) {}

  public ngOnInit(): void {
    if (this.cluster.spec.cloud.bringyourown === undefined) {
      this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe(result => {
          this.nodeDC = result;
        }
      );
    }
  }

  public getClusterImagePath(): string {
    let path = '/assets/images/clouds/';

    if (this.cluster.spec.cloud.aws) {
      path += 'aws.png';
    } else if (this.cluster.spec.cloud.digitalocean) {
      path += 'digitalocean.png';
    } else if (this.cluster.spec.cloud.openstack) {
      path += 'openstack.png';
    } else if (this.cluster.spec.cloud.bringyourown) {
      path += 'bringyourown.png';
    }

    return path;
  }

  public getShortClusterName(name: string): string {
    return name.length > 12 ? name.slice(0, 12) + '...' : name;
  }

  public statusRunning(): boolean {
    if (this.cluster.status.phase === 'Running') {
      if (this.health) {
        if (!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.nodeController || !this.health.scheduler) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  public statusFailed(): boolean {
    if (this.cluster.status.phase === 'Failed') {
      return true;
    } else {
      return false;
    }
  }

  public statusWaiting(): boolean {
    if (this.cluster.status.phase !== 'Running' && this.cluster.status.phase !== 'Failed') {
      return true;
    } else {
      if (this.health) {
        if ((!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.nodeController || !this.health.scheduler) && this.cluster.status.phase === 'Running') {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  public getDatacenter(): string {
    let datacenter: string;
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe(res => {
      datacenter = res.spec.seed;
    });
    return datacenter;
  }

  public ngOnDestroy(): void { }
}
