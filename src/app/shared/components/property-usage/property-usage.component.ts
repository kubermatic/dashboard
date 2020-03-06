import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-property-usage',
  templateUrl: './property-usage.component.html',
  styleUrls: ['./property-usage.component.scss'],
})
export class PropertyUsageComponent {
  @Input() name: string;
  @Input() used: number;
  @Input() total: number;
  @Input() unit: string;

  getPercentage(): number|undefined {
    return this.used && this.total ? Math.round((((this.used / this.total) * 100) + Number.EPSILON) * 100) / 100 :
                                     undefined;
  }

  getTooltip(): string {
    return this.getPercentage() ? `${this.getPercentage()}%` : '';
  }
}
