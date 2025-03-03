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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {OPAService} from '@core/services/opa';
import {Violation} from '@shared/entity/opa';
import {UserSettings} from '@shared/entity/settings';

@Component({
  selector: 'km-violation-details-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class ViolationDetailsComponent implements OnInit {
  @Input() violations: Violation[] = [];
  @Input() settings: UserSettings;
  @Input() constraintName: string;
  @Input() projectId: string;
  @Input() clusterId: string;
  displayedColumns: string[] = ['name', 'enforcement', 'kind', 'message'];
  dataSource = new MatTableDataSource<Violation>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;

  constructor(private readonly _opaService: OPAService) {}

  ngOnInit(): void {
    this.dataSource.data = this.violations || [];
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.paginator.pageSize = this.settings.itemsPerPage;
    this.paginator.pageIndex = this._opaService.getViolationPageIndex(
      this.projectId,
      this.clusterId,
      this.constraintName
    );
    this.sort.active = 'name';
    this.sort.direction = 'asc';
  }

  isPaginatorVisible(): boolean {
    return (
      this.violations &&
      this.violations.length > 0 &&
      this.paginator &&
      this.violations.length > this.paginator.pageSize
    );
  }

  onPaginateChange(event: PageEvent): void {
    this._opaService.saveViolationPageIndex(this.projectId, this.clusterId, this.constraintName, event.pageIndex);
  }
}
