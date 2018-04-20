import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { ClusterService } from '../../core/services';


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
  private healthStatus: string;

  constructor( private clusterService: ClusterService) {}

  ngOnChanges() {
    this.healthStatus = this.clusterService.getClusterHealthStatus(this.cluster);
  }

  public getHealthStatusColor(): string {
    if (this.cluster.status.health) {
      if (this.healthStatus === 'statusRunning') {
        return this.green;
      } else if (this.healthStatus === 'statusFailed' || this.healthStatus === 'statusDeleting') {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
