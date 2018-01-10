import {Component, OnInit, Input} from '@angular/core';
import {Health, Status} from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() health: Health;
  @Input() status: Status;
  green = 'fa fa-circle green';
  red = 'fa fa-circle red';
  orange = 'fa fa-circle orange';

  constructor() { }

  ngOnInit() {

  }

  public getHealthStatusColor() {
    if (this.health) {
      if (this.health.apiserver && this.health.controller && this.health.etcd && this.health.scheduler && this.health.nodeController) {
        return this.green;
      } else if ((!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.scheduler || !this.health.nodeController) && this.status.phase === 'Failed') {
        return this.red;
      } else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
