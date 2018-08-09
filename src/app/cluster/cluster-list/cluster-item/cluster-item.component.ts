import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ClusterService } from '../../../core/services';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss'],
})
export class ClusterItemComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() index: number;
  /*@Input() health: Health;*/
  public nodeDC: DataCenterEntity;

  constructor(private dcService: DatacenterService,
              private clusterService: ClusterService) {}

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
    } else if (this.cluster.spec.cloud.hetzner) {
      path += 'hetzner.png';
    } else if (this.cluster.spec.cloud.vsphere) {
      path += 'vsphere.png';
    } else if (this.cluster.spec.cloud.azure) {
      path += 'azure.png';
    }

    return path;
  }

  public getShortClusterName(name: string): string {
    return name.length > 12 ? name.slice(0, 12) + '...' : name;
  }

  public getClusterItemClass() {
    let itemClass = this.clusterService.getClusterHealthStatus(this.cluster);
    if (this.index % 2 !== 0) {
      itemClass = itemClass  + ' odd';
    }
    return itemClass;
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
