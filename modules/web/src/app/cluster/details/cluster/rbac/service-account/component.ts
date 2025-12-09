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
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {RBACService} from '@core/services/rbac';
import {Cluster} from '@shared/entity/cluster';
import {ClusterBinding, ClusterServiceAccount, Kind, NamespaceBinding, SimpleClusterBinding} from '@shared/entity/rbac';
import {Subject, combineLatest} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

enum BindingMode {
  Cluster = 'Cluster',
  Namespace = 'Namespace',
}

enum Column {
  StateArrow = 'stateArrow',
  Name = 'name',
  Namespace = 'namespace',
  Actions = 'action',
  Details = 'details',
}

@Component({
  selector: 'km-rbac-service-account',
  templateUrl: './template.html',
  standalone: false,
})
export class RBACServiceAccountComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly Column = Column;
  columns = [Column.StateArrow, Column.Name, Column.Namespace, Column.Actions];
  isLoading = true;
  dataSource = new MatTableDataSource<ClusterServiceAccount>();
  bindingDetails: Record<string, SimpleClusterBinding[]>;
  clusterServiceAccountExpansion: Record<string, boolean> = {};

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Output() addBinding = new EventEmitter<ClusterServiceAccount>();
  @Output() deleteBinding = new EventEmitter<SimpleClusterBinding>();
  @Output() deleteClusterServiceAccount = new EventEmitter<ClusterServiceAccount>();

  constructor(
    private readonly _rbacService: RBACService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService
  ) {}

  ngOnInit(): void {
    this._getServiceAccounts();
    this._getBindings();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  expandRow({id}: ClusterServiceAccount): void {
    this.clusterServiceAccountExpansion[id] = !this.clusterServiceAccountExpansion[id];
  }

  download(serviceAccount: ClusterServiceAccount): void {
    window.open(
      this._clusterServiceAccountService.getKubeconfigUrl(
        this.projectID,
        this.cluster.id,
        serviceAccount.namespace,
        serviceAccount.id
      ),
      '_blank',
      'noopener,noreferrer'
    );
  }

  deleteServiceAccount(element: ClusterServiceAccount): void {
    this.deleteClusterServiceAccount.emit(element);
  }

  addServiceAccountBinding(serviceAccount: ClusterServiceAccount): void {
    this.addBinding.emit(serviceAccount);
  }

  deleteServiceAccountBinding(element: SimpleClusterBinding): void {
    this.deleteBinding.emit(element);
  }

  private _getServiceAccounts(): void {
    this._clusterServiceAccountService
      .get(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(serviceAccount => {
        this.dataSource.data = serviceAccount;
        this.isLoading = false;
      });
  }

  private _getBindings(): void {
    const mapBinding = (binding: (NamespaceBinding | ClusterBinding)[]) =>
      binding
        .map(
          ({namespace, roleRefName, subjects = []}): NamespaceBinding => ({
            namespace,
            roleRefName,
            subjects: subjects.filter(({kind}) => kind === Kind.ServiceAccount),
          })
        )
        .filter(({subjects}) => subjects.length);

    const clusterBindings$ = this._rbacService
      .getClusterBindings(this.cluster.id, this.projectID)
      .pipe(map(clusterBindings => mapBinding(clusterBindings)))
      .pipe(takeUntil(this._unsubscribe));

    const namespaceBindings$ = this._rbacService
      .getNamespaceBindings(this.cluster.id, this.projectID)
      .pipe(map(bindings => mapBinding(bindings)))
      .pipe(takeUntil(this._unsubscribe));

    combineLatest([clusterBindings$, namespaceBindings$])
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(([clusterBindings = [], namespaceBindings = []]) => {
        this.bindingDetails = [...clusterBindings, ...namespaceBindings].reduce(
          (prev, {subjects, roleRefName: clusterRole, namespace}) => {
            subjects.forEach(({name, kind, namespace: subjectNamespace}) => {
              prev[name] = [
                ...(prev[name] ?? []),
                {
                  scope: namespace ? BindingMode.Namespace : BindingMode.Cluster,
                  namespace,
                  name,
                  kind,
                  clusterRole,
                  subjectNamespace,
                },
              ];
            });

            return prev;
          },
          {} as Record<string, SimpleClusterBinding[]>
        );

        this.isLoading = false;
      });
  }
}
