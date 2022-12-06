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

import {Component, OnDestroy, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {RBACService} from '@core/services/rbac';
import {Subject, combineLatest} from 'rxjs';
import {takeUntil, map, filter, switchMap, take} from 'rxjs/operators';
import {ClusterServiceAccount} from '@shared/entity/cluster-service-account';
import {MatTableDataSource} from '@angular/material/table';
import {Cluster} from '@shared/entity/cluster';
import {ClusterBinding, Binding, SimpleClusterBinding, Kind} from '@shared/entity/rbac';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {ConfirmationDialogComponent} from '@app/shared/components/confirmation-dialog/component';

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
  styleUrls: ['./style.scss'],
})
export class RBACServiceAccountComponent implements OnInit, OnDestroy {
  private _unsubscribe$ = new Subject<void>();

  readonly BindingMode = BindingMode;
  readonly Column = Column;
  columns = [Column.StateArrow, Column.Name, Column.Namespace, Column.Actions];

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Output() addBindingToServiceAccount = new EventEmitter<ClusterServiceAccount>();
  @Output() deleteBinding = new EventEmitter<SimpleClusterBinding>();

  clusterServiceAccountExpansion: Record<string, boolean> = {};

  isLoading = true;

  dataSource = new MatTableDataSource<ClusterServiceAccount>();
  bindingDetails: Record<string, SimpleClusterBinding[]>;

  constructor(
    // @ts-ignore
    private readonly _matDialog: MatDialog,
    private readonly _rbacService: RBACService,
    // @ts-ignore
    private readonly _notificationService: NotificationService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService
  ) {}

  ngOnInit(): void {
    this._getServiceAccounts();
    this._getBindings();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  expandRow({id}: ClusterServiceAccount): void {
    this.clusterServiceAccountExpansion[id] = !this.clusterServiceAccountExpansion[id];
  }

  addBinding(serviceAccount: ClusterServiceAccount): void {
    this.addBindingToServiceAccount.emit(serviceAccount);
  }

  download(serviceAccount: ClusterServiceAccount): void {
    window.open(
      this._clusterServiceAccountService.kubeconfig(
        this.projectID,
        this.cluster.id,
        serviceAccount.namespace,
        serviceAccount.id
      ),
      '_blank'
    );
  }

  deleteServiceAccount(element: ClusterServiceAccount): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Delete Binding',
        message: `Delete service account <b>${element.name}</b> of <b>${this.cluster.name}</b> cluster permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef
      .afterClosed()
      .pipe(
        filter(isConfirmed => isConfirmed),
        switchMap(_ =>
          this._clusterServiceAccountService.delete(this.projectID, this.cluster.id, element.namespace, element.name)
        ),
        take(1)
      )
      .subscribe(() => {
        this._updateBindings();
        this._notificationService.success(`Removed service account ${element.name} from ${this.cluster.name}`);
      });
  }

  deleteServiceAccountBinding(element: SimpleClusterBinding): void {
    this.deleteBinding.emit(element);
  }

  private _updateBindings(): void {
    this._clusterServiceAccountService.update();
    this._rbacService.refreshClusterBindings();
    this._rbacService.refreshNamespaceBindings();
  }

  private _getServiceAccounts(): void {
    this._clusterServiceAccountService
      .get(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(serviceAccount => {
        this.dataSource.data = serviceAccount;
        this.clusterServiceAccountExpansion = serviceAccount.reduce(
          (prev: Record<string, boolean>, {id}) => ({...prev, [id]: false}),
          {}
        );

        this.isLoading = false;
      });
  }

  private _getBindings(): void {
    const mapBinding = (binding: (Binding | ClusterBinding)[]) =>
      binding
        .map(
          ({namespace, roleRefName, subjects = []}): Binding => ({
            namespace,
            roleRefName,
            subjects: subjects.filter(({kind}) => kind === Kind.ServiceAccount),
          })
        )
        .filter(({subjects}) => subjects.length);

    const clusterBindings$ = this._rbacService
      .getClusterBindings(this.cluster.id, this.projectID)
      .pipe(map(clusterBindings => mapBinding(clusterBindings)));

    const namespaceBindings$ = this._rbacService
      .getNamespaceBindings(this.cluster.id, this.projectID)
      .pipe(map(bindings => mapBinding(bindings)));

    combineLatest([clusterBindings$, namespaceBindings$])
      .pipe(takeUntil(this._unsubscribe$))
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
