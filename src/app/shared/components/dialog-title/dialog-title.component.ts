import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-dialog-title',
  templateUrl: './dialog-title.component.html',
})
export class DialogTitleComponent {
  @Input() title: string;
}
