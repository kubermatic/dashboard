// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {OPAService} from '@core/services/opa';
import {UserService} from '@core/services/user';
import {Constraint} from '@shared/entity/opa';
import {UserSettings} from '@shared/entity/settings';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-default-constraint-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class DefaultConstraintComponent implements OnInit, OnChanges, OnDestroy {
  settings: UserSettings;
  defaultConstraints: Constraint[] = [];
  dataSource = new MatTableDataSource<Constraint>();
  displayedColumns: string[] = ['stateArrow', 'name', 'constraintTemplate', 'actions'];
  toggledColumns: string[] = ['violationDetails'];
  isShowDetails = [];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(private readonly _opaService: OPAService, private readonly _userService: UserService) {}

  ngOnInit() {
    this.dataSource.data = this.defaultConstraints;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._opaService.defaultConstraints.pipe(takeUntil(this._unsubscribe)).subscribe(defaultConstraints => {
      this.defaultConstraints = defaultConstraints;
      this.dataSource.data = this.defaultConstraints;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.settings = settings;
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.defaultConstraints) {
      this.dataSource.data = this.defaultConstraints;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.defaultConstraints &&
      this.defaultConstraints.length > 0 &&
      this.paginator &&
      this.defaultConstraints.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.defaultConstraints);
  }

  toggleDetails(element: Constraint): void {
    this.isShowDetails[element.name] = !this.isShowDetails[element.name];
  }

  add(): void {}
}
