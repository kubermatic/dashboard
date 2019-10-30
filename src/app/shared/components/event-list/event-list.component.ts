import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, MatSort, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {SettingsService} from '../../../core/services/settings/settings.service';
import {EventEntity} from '../../entity/EventEntity';

@Component({
  selector: 'km-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() events: EventEntity[] = [];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  isShowEvents = false;
  dataSource = new MatTableDataSource<EventEntity>();
  displayedColumns: string[] =
      ['status', 'message', 'involvedObjectName', 'involvedObjectKind', 'count', 'lastTimestamp'];
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this.dataSource.data = this.events;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.sort.active = 'lastTimestamp';
    this.sort.direction = 'desc';

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;  // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.events;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
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
    return this.isShowEvents && this.hasEvents() && this.paginator && this.events.length >= this.paginator.pageSize;
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
