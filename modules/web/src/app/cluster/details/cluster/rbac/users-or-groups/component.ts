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

import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {RBACService} from '@core/services/rbac';
import {Cluster} from '@shared/entity/cluster';
import {ClusterBinding, Kind, NamespaceBinding, SimpleClusterBinding} from '@shared/entity/rbac';
import {Subject, combineLatest} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

enum BindingMode {
  Cluster = 'Cluster',
  Namespace = 'Namespace',
}

enum Column {
  Scope = 'Scope',
  User = 'User',
  Group = 'Group',
  ClusterRole = 'Cluster Role',
  Namespace = 'Namespace',
  Actions = 'Actions',
}

@Component({
    selector: 'km-rbac-users-or-groups',
    templateUrl: './template.html',
    standalone: false
})
export class RBACUsersOrGroupsComponent implements OnInit, OnDestroy {
  private _unsubscribe = new Subject<void>();
  readonly Column = Column;
  readonly RBACType = Kind;
  columns = [Column.Scope, Column.User, Column.ClusterRole, Column.Namespace, Column.Actions];

  isLoading = true;
  dataSource = new MatTableDataSource<SimpleClusterBinding>();

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() rbacType = Kind.User;
  @Output() deleteBinding = new EventEmitter<SimpleClusterBinding>();

  constructor(private readonly _rbacService: RBACService) {}

  ngOnInit(): void {
    this._getBindings();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  delete(binding: SimpleClusterBinding): void {
    this.deleteBinding.emit(binding);
  }

  private _getBindings(): void {
    const mapBinding = (binding: (NamespaceBinding | ClusterBinding)[]) =>
      binding
        .map(({subjects = [], ...obj}): NamespaceBinding | ClusterBinding => ({
          ...obj,
          subjects: subjects.filter(({kind}) => kind === this.rbacType),
        }))
        .filter(({subjects}) => subjects.length);

    const clusterBindings$ = this._rbacService
      .getClusterBindings(this.cluster.id, this.projectID)
      .pipe(map(clusterBindings => mapBinding(clusterBindings)));

    const namespaceBindings$ = this._rbacService
      .getNamespaceBindings(this.cluster.id, this.projectID)
      .pipe(map(bindings => mapBinding(bindings)));

    combineLatest([clusterBindings$, namespaceBindings$])
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([clusterBindings = [], namespaceBindings = []]) => {
        this.dataSource.data = [...clusterBindings, ...namespaceBindings].reduce(
          (prev, {subjects = [], roleRefName, namespace}) => {
            subjects.forEach(({name, kind, namespace: subjectNamespace}) => {
              prev = [
                ...prev,
                {
                  scope: namespace ? BindingMode.Namespace : BindingMode.Cluster,
                  namespace,
                  name,
                  kind,
                  clusterRole: roleRefName,
                  subjectNamespace,
                },
              ];
            });

            return prev;
          },
          [] as SimpleClusterBinding[]
        );

        this.isLoading = false;
      });
  }
}
