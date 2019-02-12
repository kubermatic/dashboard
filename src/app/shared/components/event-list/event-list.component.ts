import {Component, Input} from '@angular/core';
import {MatTableDataSource} from '@angular/material';

import {EventEntity} from '../../entity/EventEntity';

@Component({
  selector: 'km-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent {
  @Input() events: EventEntity[] = [];

  displayedColumns: string[] = ['type', 'message', 'involvedObjectName'];

  // todo sort pagination

  getDataSource(): MatTableDataSource<EventEntity> {
    const dataSource = new MatTableDataSource<EventEntity>();
    dataSource.data = this.events;
    return dataSource;
  }

  getTypeIcon(event: EventEntity): string {
    switch (event.type) {
      case 'Normal':
        return 'fa fa-info-circle green';
      case 'Warning':
        return 'fa fa-exclamation-circle orange';
      default:
        return 'fa fa-question-circle';
    }
  }
}
