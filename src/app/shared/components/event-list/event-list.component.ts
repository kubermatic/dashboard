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

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  isShowEvents = false;
  dataSource = new MatTableDataSource<EventEntity>();
  displayedColumns: string[] =
      ['status', 'message', 'involvedObjectName', 'involvedObjectKind', 'count', 'lastTimestamp'];

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
        return 'fa fa-circle green';
      case 'Warning':
        return 'fa fa-circle orange';
      default:
        return 'fa fa-circle';
    }
  }

  hasEvents(): boolean {
    return this.events && this.events.length > 0;
  }

  isPaginatorVisible(): boolean {
    return (this.events && this.paginator && this.events.length <= this.paginator.pageSize) || !this.hasEvents();
  }

  toggleEvents(): void {
    this.isShowEvents = !this.isShowEvents;
  }

  getTypeIconForEvents(): string {
    if (this.events.filter((event) => event.type === 'Warning').length > 0) {
      return 'fa fa-circle orange';
    } else if (this.events.filter((event) => event.type === 'Normal').length > 0) {
      return 'fa fa-circle green';
    } else {
      return '';
    }
  }
}
