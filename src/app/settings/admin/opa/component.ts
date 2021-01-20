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

import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {ApiService} from '@core/services/api/service';
import {UserService} from '@core/services/user/service';
import {ConstraintTemplate} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-opa-admin',
  templateUrl: './template.html',
})
export class OPAAdminComponent implements OnInit, OnDestroy {
  constraintTemplates: ConstraintTemplate[] = [];
  dataSource = new MatTableDataSource<ConstraintTemplate>();
  displayedColumns: string[] = ['templateName', 'appliesTo', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _apiService: ApiService, private readonly _userService: UserService) {}

  ngOnInit() {
    this.dataSource.data = this.constraintTemplates;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'templateName';
    this.sort.direction = 'asc';

    this._apiService
      .getConstraintTemplates()
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(constraintTemplates => {
        this.constraintTemplates = constraintTemplates;
        this.dataSource.data = this.constraintTemplates;
      });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.constraintTemplates &&
      this.constraintTemplates.length > 0 &&
      this.paginator &&
      this.constraintTemplates.length > this.paginator.pageSize
    );
  }
}
