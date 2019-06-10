import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-relative-time',
  templateUrl: './relative-time.component.html',
})
export class RelativeTimeComponent {
  @Input() date: string;
}
