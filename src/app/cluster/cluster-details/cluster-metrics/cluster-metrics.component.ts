import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'km-cluster-metrics',
  templateUrl: './cluster-metrics.component.html',
  styleUrls: ['./cluster-metrics.component.scss'],
})

export class ClusterMetricsComponent {
  @Input() metrics: any;
}
