import {Component, Input} from '@angular/core';
import {ClusterMetrics} from '../../../shared/entity/Metrics';

@Component({
  selector: 'km-cluster-metrics',
  templateUrl: './cluster-metrics.component.html',
  styleUrls: ['./cluster-metrics.component.scss'],
})

export class ClusterMetricsComponent {
  @Input() metrics: ClusterMetrics;
}
