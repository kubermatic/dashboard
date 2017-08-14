import {Component, OnInit, Input} from '@angular/core';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() health;
  green = "fa fa-circle green";
  red = "fa fa-circle-o red";
  orange = "fa fa-spin fa-circle-o-notch orange";

  constructor() { }

  ngOnInit() {
  }

  public getHealthStatusColor(type) {
    if (this.health) {
      switch (type) {
        case "apiserver":
          return this.health.apiserver ? this.green : this.red;
        case "controller":
          return this.health.controller ? this.green : this.red;
        case "etcd":
          return this.health.etcd[0] ? this.green : this.red;
        case "scheduler":
            return this.health.scheduler ? this.green : this.red;
        default:
          return this.orange;
      }
    } else {
      return this.orange;
    }
  }
}
