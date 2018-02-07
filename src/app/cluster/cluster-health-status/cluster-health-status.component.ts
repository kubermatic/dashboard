import {Component, Input} from '@angular/core';
import {Health, Status} from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent {
  @Input() public health: Health;
  @Input() public phase: string;
  public green: string = 'fa fa-circle green';
  public red: string = 'fa fa-circle red';
  public orange: string = 'fa fa-circle orange';

  constructor() { }

  public getHealthStatusColor(): string {
    if (this.health) {
      if (this.health.apiserver && this.health.controller && this.health.etcd && this.health.scheduler && this.health.nodeController) {
        return this.green;
      } else if ((!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.scheduler || !this.health.nodeController) && this.phase === 'Failed') {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
