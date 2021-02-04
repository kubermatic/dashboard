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

import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Violation} from '@shared/entity/opa';

@Component({
  selector: 'km-violation-details-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ViolationDetailsComponent implements OnInit {
  @Input() violations: Violation[];
  displayedColumns: string[] = ['name', 'enforcement', 'kind', 'message'];
  dataSource = new MatTableDataSource<Violation>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  ngOnInit(): void {
    this.dataSource.data = this.violations || [];
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
  }
}
