import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-boolean-property',
  templateUrl: './boolean-property.component.html',
})
export class BooleanPropertyComponent {
  @Input() label: string;
  @Input() value: boolean;

  getIcon(): string {
    return this.value ? 'km-icon-running' : 'km-icon-disabled';
  }
}
