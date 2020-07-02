import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {SettingsService} from '../../../core/services/settings/settings.service';
import {Event} from '../../entity/event';
import {HealthStatusColor} from '../../utils/health-status/health-status';

@Component({
  selector: 'km-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.scss'],
})
export class EventListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() events: Event[] = [];

  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  isShowEvents = false;
  dataSource = new MatTableDataSource<Event>();
  displayedColumns: string[] = [
    'status',
    'message',
    'involvedObjectName',
    'involvedObjectKind',
    'count',
    'lastTimestamp',
  ];
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
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this.events;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypeIcon(event: Event): string {
    switch (event.type) {
      case 'Normal':
        return HealthStatusColor.Green;
      case 'Warning':
        return HealthStatusColor.Orange;
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
    if (this.events.filter(event => event.type === 'Warning').length > 0) {
      return HealthStatusColor.Orange;
    } else if (this.events.filter(event => event.type === 'Normal').length > 0) {
      return HealthStatusColor.Green;
    }
    return '';
  }
}
