import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-cluster-metrics',
  templateUrl: './cluster-metrics.component.html',
  styleUrls: ['./cluster-metrics.component.scss'],
})

export class ClusterMetricsComponent {
  @Input() metrics: any;
  colorScheme = {domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5']};

  cpuFormat(): string {
    const used = this.metrics && this.metrics.nodes && this.metrics.nodes.cpuTotalMillicores ?
        this.metrics.nodes.cpuTotalMillicores :
        0;
    const available = this.metrics && this.metrics.nodes && this.metrics.nodes.cpuAvailableMillicores ?
        this.metrics.nodes.cpuAvailableMillicores :
        0;
    return `${used}/${available} milicores`;
  }
}
