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
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _userService: UserService) {}

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
        return 'km-icon-running';
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
}
