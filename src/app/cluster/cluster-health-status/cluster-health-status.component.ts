import {Component, OnInit, Input} from '@angular/core';
import {Health} from '../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() health: Health;
  green = 'fa fa-circle green';
  red = 'fa fa-circle-o red';
  orange = 'fa fa-spin fa-circle-o-notch orange';

  constructor() { }

  ngOnInit() {

  }

  public getHealthStatusColor() {
    if (this.health) {
      if (this.health.apiserver && this.health.controller && this.health.etcd && this.health.scheduler && this.health.nodeController) {
        return this.green;
      }
      else if (!this.health.apiserver || !this.health.controller || !this.health.etcd || !this.health.scheduler || !this.health.nodeController) {
        return this.red;
      }
      else {
        return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
