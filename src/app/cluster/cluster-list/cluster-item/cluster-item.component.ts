import { Subscription } from 'rxjs/Subscription';
import { DatacenterService } from 'app/core/services';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import {Component, OnInit, OnDestroy, Input} from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss']
})
export class ClusterItemComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() index: number;

  public seedDc: DataCenterEntity;
  public nodeDc: DataCenterEntity;
  public subscriptions: Subscription[] = [];

  constructor(private dcService: DatacenterService) {}

  public ngOnInit(): void {
    if (!this.seedDc) {
      const sub = this.loadDataCenter(this.cluster.spec.seedDatacenterName, 'seedDc');
      this.subscriptions.push(sub);
    }

    if (!this.nodeDc && !this.cluster.spec.cloud.bringyourown) {
      const sub = this.loadDataCenter(this.cluster.spec.cloud.dc, 'nodeDc');
      this.subscriptions.push(sub);
    }
  }

  public loadDataCenter(dcName: string, dcObjectName: string): Subscription {
    return this.dcService.getDataCenter(dcName).subscribe(
      res => {
        this[dcObjectName] = new DataCenterEntity(res.metadata, res.spec, res.seed);
      }
    );
  }

  public getClusterImagePath(): string {
    let path: string = '/assets/images/clouds/';

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
    return name.length > 12 ?  name.slice(0, 12) + '...' : name;
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      sub.unsubscribe();
    });
  }
}
