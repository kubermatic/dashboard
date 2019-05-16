import {Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource} from '@angular/material';

import {EventEntity} from '../../entity/EventEntity';

@Component({
  selector: 'km-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit, OnChanges {
  @Input() events: EventEntity[] = [];

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<EventEntity>();
  displayedColumns: string[] =
      ['type', 'message', 'involvedObjectName', 'involvedObjectKind', 'count', 'lastTimestamp'];

  ngOnInit(): void {
    this.dataSource.data = this.events;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'lastTimestamp';
    this.sort.direction = 'desc';
  }

  ngOnChanges(): void {
    this.dataSource.data = this.events;
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

  hasEvents(): boolean {
    return this.events && this.events.length > 0;
  }
}
