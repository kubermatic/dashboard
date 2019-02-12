import {Component, Input} from '@angular/core';
import {EventEntity} from '../../entity/EventEntity';

@Component({
  selector: 'km-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent {
  @Input() events: EventEntity[] = [];
}
