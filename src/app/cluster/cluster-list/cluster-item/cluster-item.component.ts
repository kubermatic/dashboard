import { DatacenterService } from 'app/core/services';
import { NodeProvider } from 'app/shared/model/NodeProviderConstants';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import {Component, OnInit, Input} from '@angular/core';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-item',
  templateUrl: './cluster-item.component.html',
  styleUrls: ['./cluster-item.component.scss']
})
export class ClusterItemComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() index: number;

  public seedDc: DataCenterEntity;
  public nodeDc: DataCenterEntity;

  constructor(private dcService: DatacenterService) {}

  ngOnInit() {
    if (!this.seedDc) {
      this.loadDataCenter(this.cluster.spec.seedDatacenterName, 'seedDc');
    }

    if (!this.nodeDc && this.cluster.provider !== NodeProvider.BRINGYOUROWN) {
      this.loadDataCenter(this.cluster.spec.cloud.dc, 'nodeDc');
    }

  }

  public loadDataCenter(dcName, dcObjectName): void {
    this.dcService.getDataCenter(dcName).subscribe(
      res => {
        this[dcObjectName] = new DataCenterEntity(res.metadata, res.spec, res.seed);
      }
    );
  }

  public getShortClusterName(name: string): string {
    return name.length > 12 ?  name.slice(0, 12) + '...' : name;
  }
}
