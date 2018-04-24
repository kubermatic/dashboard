import {Component, Input, OnChanges} from '@angular/core';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { ClusterService } from '../../core/services';
import { ClusterHealth } from '../../shared/model/ClusterHealthConstants';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnChanges {
  @Input() public cluster: ClusterEntity;

  public green = 'fa fa-circle green';
  public red = 'fa fa-circle red';
  public orange = 'fa fa-spin fa-circle-o-notch orange';
  public healthStatus: string;

  constructor( private clusterService: ClusterService) {}

  ngOnChanges() {
    this.healthStatus = this.clusterService.getClusterHealthStatus(this.cluster);
  }

  public getHealthStatusColor(): string {
    if (this.cluster.status.health) {
      if (this.healthStatus === ClusterHealth.RUNNING) {
        return this.green;
      } else if (this.healthStatus === ClusterHealth.DELETING) {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }

  public getHealthTooltipText(): string {
    if (this.healthStatus === ClusterHealth.DELETING) {
      return 'Deleting might take up to 15 minutes';
    } else {
      return '';
    }
  }
}
