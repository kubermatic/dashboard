import {Component, Input} from '@angular/core';

@Component({selector: 'km-combobox', templateUrl: 'template.html'})
export class ComboboxComponent {
  @Input() groups: string[];
  @Input() options: string[];
}
