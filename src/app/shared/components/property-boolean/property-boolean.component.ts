import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-property-boolean',
  templateUrl: './property-boolean.component.html',
})
export class PropertyBooleanComponent {
  @Input() label: string;
  @Input() value: boolean;

  getIcon(): string {
    return this.value ? 'km-icon-running' : 'km-icon-disabled';
  }
}
