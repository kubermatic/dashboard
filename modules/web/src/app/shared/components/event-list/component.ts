// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {Event} from '@shared/entity/event';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-event-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class EventListComponent implements OnInit, OnChanges, OnDestroy {
  private _unsubscribe = new Subject<void>();

  @Input() events: Event[] = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Event>();
  displayedColumns: string[] = [
    'status',
    'message',
    'involvedObjectName',
    'involvedObjectKind',
    'count',
    'lastTimestamp',
  ];
  silenceErrorEvents = false;

  constructor(
    private readonly _userService: UserService,
    private readonly _settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.dataSource.data = this.events;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;

    this.sort.active = 'lastTimestamp';
    this.sort.direction = 'desc';

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._settingsService.adminSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.silenceErrorEvents = settings.notifications?.hideErrorEvents;

      this.events = this.filterEvents(this.events);
    });
  }

  ngOnChanges(): void {
    this.dataSource.data = this._group(this.events);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getTypeIcon(event: Event): string {
    switch (event.type) {
      case 'Normal':
        return 'km-icon-check';
      case 'Warning':
        return 'km-icon-warning-event';
      default:
        return 'km-icon-circle';
    }
  }

  hasEvents(): boolean {
    return this.events && this.events.length > 0;
  }

  isPaginatorVisible(): boolean {
    return this.hasEvents() && this.paginator && this.events.length >= this.paginator.pageSize;
  }

  private _hash(event: Event): number {
    const s = event.message + event.type + event.involvedObject?.name || '';
    const shift = 5;
    let hash = 0;

    if (s.length === 0) {
      return hash;
    }

    for (let i = 0; i < s.length; i++) {
      const char = s.charCodeAt(i);
      hash = (hash << shift) - hash + char;
      hash = hash & hash;
    }

    return hash;
  }

  private _group(events: Event[]): Event[] {
    const map = new Map<number, Event>();

    events.forEach(event => {
      const hash = this._hash(event);
      if (map.has(hash)) {
        const ev = event;
        ev.count += map.get(hash).count;
        map.set(hash, ev);
      }

      map.set(hash, event);
    });

    return this.filterEvents(Array.from(map.values()));
  }

  private filterEvents(events: Event[]): Event[] {
    return events.filter(e => !(e.type === 'Warning' && this.silenceErrorEvents));
  }
}
