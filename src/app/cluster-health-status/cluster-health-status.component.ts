import {Component, OnInit, Input} from '@angular/core';
import {MdTooltip, MdButton} from '@angular/material';

@Component({
  selector: 'kubermatic-cluster-health-status',
  templateUrl: './cluster-health-status.component.html',
  styleUrls: ['./cluster-health-status.component.scss']
})
export class ClusterHealthStatusComponent implements OnInit {
  @Input() health: any;

  constructor() { }

  ngOnInit() {
  }

}
