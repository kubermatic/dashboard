import { Component, Input } from '@angular/core';
import { ClusterEntity, getClusterHealthStatus } from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent {
  @Input() public cluster: ClusterEntity;

  public green = 'fa fa-circle green';
  public red = 'fa fa-circle red';
  public orange = 'fa fa-spin fa-circle-o-notch orange';

  constructor() { }

  public getHealthStatusColor(): string {
    const healthStatus = getClusterHealthStatus(this.cluster);

    if (this.cluster.status.health) {
      if (healthStatus === 'statusRunning') {
        return this.green;
      } else if (healthStatus === 'statusFailed' || healthStatus === 'statusDeleting') {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
