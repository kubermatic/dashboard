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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {Cluster} from '@shared/entity/cluster';
import {Constraint} from '@shared/entity/opa';
import * as _ from 'lodash';
import {Subject} from 'rxjs';

@Component({
  selector: 'km-constraints-list',
  templateUrl: './template.html',
})
export class ConstraintsComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  constraintsDataSource = new MatTableDataSource<Constraint>();
  constraintsDisplayedColumns: string[] = ['constraintName', 'constraintTemplate', 'targets', 'violations', 'actions'];
  private _unsubscribe = new Subject<void>();

  constructor() {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isLoadingData(data: Constraint[]): boolean {
    return _.isEmpty(data);
  }

  hasNoData(data: Constraint[]): boolean {
    return _.isEmpty(data);
  }
}
