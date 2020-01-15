import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-horizontal-usage-graph',
  templateUrl: './horizontal-usage-graph.component.html',
  styleUrls: ['./horizontal-usage-graph.component.scss'],
})
export class HorizontalUsageGraphComponent {
  @Input() title: string;
  @Input() used: number;
  @Input() total: number;
  @Input() unit: string;

  getPercentage(): number|undefined {
    return this.used && this.total ? (this.used / this.total) * 100 : undefined;
  }

  getTooltip(): string {
    return this.getPercentage() ? `${this.getPercentage()}%` : '';
  }
}
