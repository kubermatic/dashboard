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

import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {Member} from '@shared/entity/member';
import {Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-accounts',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class AccountsComponent implements OnInit, OnChanges {
  users: Member[] = [];
  isLoading = false;
  currentUser: Member;
  dataSource = new MatTableDataSource<Member>();
  displayedColumns: string[] = ['name', 'role', 'email', 'lastSeen', 'creationTimestamp'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _settingsService: SettingsService, private readonly _userService: UserService) {}

  ngOnInit() {
    this.dataSource.data = this.users;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
    this.isLoading = true;

    this._settingsService.users.pipe(takeUntil(this._unsubscribe)).subscribe({
      next: users => {
        this.users = this._filter(users);
        this.dataSource.data = this.users;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
      complete: () => (this.isLoading = false),
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this.currentUser = user));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.users;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  isPaginatorVisible(): boolean {
    return this.users && this.users.length > 0 && this.paginator && this.users.length > this.paginator.pageSize;
  }

  private _filter(members: Member[]): Member[] {
    const notEmpty = (member: Member) => !!member.name && !!member.email;
    return members.filter(notEmpty);
  }
}
