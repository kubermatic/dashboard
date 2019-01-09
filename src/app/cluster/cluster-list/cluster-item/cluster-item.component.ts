import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {DatacenterService, HealthService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss'],
})

export class ClusterItemComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() projectID: string;
  @Input() index: number;
  nodeDC: DataCenterEntity;
  seedDC: DataCenterEntity;
  health: HealthEntity;
  private subscriptions: Subscription[] = [];

  constructor(private dcService: DatacenterService, private router: Router, private healthService: HealthService) {}

  ngOnInit(): void {
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe((result) => {
      this.nodeDC = result;
      this.dcService.getDataCenter(this.nodeDC.spec.seed).subscribe((seedRes) => {
        this.seedDC = seedRes;
      });
    });

    if (!!this.seedDC && this.getClusterItemClass() !== 'statusDeleting' && !this.cluster.deletionTimestamp) {
      this.healthService.getClusterHealth(this.cluster.id, this.seedDC.metadata.name, this.projectID)
          .subscribe((health) => {
            this.health = health;
          });
    }
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getProvider(): string {
    if (this.cluster.spec.cloud.aws) {
      return 'aws';
    } else if (this.cluster.spec.cloud.digitalocean) {
      return 'digitalocean';
    } else if (this.cluster.spec.cloud.openstack) {
      return 'openstack';
    } else if (this.cluster.spec.cloud.bringyourown) {
      return 'bringyourown';
    } else if (this.cluster.spec.cloud.hetzner) {
      return 'hetzner';
    } else if (this.cluster.spec.cloud.vsphere) {
      return 'vsphere';
    } else if (this.cluster.spec.cloud.azure) {
      return 'azure';
    }
  }

  getShortClusterName(name: string): string {
    return name.length > 12 ? name.slice(0, 12) + '...' : name;
  }

  getClusterItemClass(): string {
    let itemClass = this.healthService.getClusterHealthStatus(this.cluster, this.health);
    if (this.index % 2 !== 0) {
      itemClass = itemClass + ' odd';
    }
    return itemClass;
  }

  getDatacenter(): string {
    let datacenter: string;
    this.dcService.getDataCenter(this.cluster.spec.cloud.dc).subscribe((res) => {
      datacenter = res.spec.seed;
    });
    return datacenter;
  }

  navigateToCluster(): void {
    const dc = this.getDatacenter();
    this.router.navigate(['/projects/' + this.projectID + '/dc/' + dc + '/clusters/' + this.cluster.id]);
  }
}
