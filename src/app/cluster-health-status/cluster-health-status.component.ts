import {Component, OnInit, Input} from '@angular/core';
import {MdTooltip, MdButton} from '@angular/material';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() health;

  constructor() { }

  ngOnInit() {
  }

  public getHealthStatusColor(type) {
    if (this.health) {
      switch (type) {
        case 'apiserver':
          return this.health.apiserver ? 'green' : 'red';
        case 'controller':
          return this.health.controller ? 'green' : 'red';
        case 'etcd':
          return this.health.etcd[0] ? 'green' : 'red';
        case 'scheduler':
            return this.health.scheduler ? 'green' : 'red';
        default:
          return 'orange';
      }
    } else {
      return 'orange';
    }
  }
}
