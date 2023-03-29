// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, OnDestroy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {Subject} from 'rxjs';
import {MatLegacyTableDataSource as MatTableDataSource} from '@angular/material/legacy-table';
import {SimpleClusterBinding} from '@shared/entity/rbac';

enum Column {
  Scope = 'Scope',
  ClusterRole = 'Cluster Role',
  PermissionNamespace = 'Permission Namespace',
  Actions = 'action',
}

@Component({
  selector: 'km-rbac-service-account-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RBACServiceAccountDetailsComponent implements OnChanges, OnDestroy {
  private _unsubscribe = new Subject<void>();

  readonly Column = Column;
  columns = [Column.Scope, Column.ClusterRole, Column.PermissionNamespace, Column.Actions];
  dataSource = new MatTableDataSource<SimpleClusterBinding>();

  @Input() details: SimpleClusterBinding[];
  @Output() deleteBinding = new EventEmitter<SimpleClusterBinding>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes.details) {
      this.dataSource.data = this.details;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  delete(binding: SimpleClusterBinding): void {
    this.deleteBinding.emit(binding);
  }
}
