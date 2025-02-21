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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ClusterServiceAccountService} from '@core/services/cluster-service-account';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import _ from 'lodash';
import {Observable, Subject, of, startWith} from 'rxjs';
import {takeUntil, map} from 'rxjs/operators';
import {Cluster} from '@shared/entity/cluster';
import {ControlsOf} from '@shared/model/shared';
import {ClusterBinding, ClusterServiceAccount} from '@shared/entity/rbac';
import {ErrorType} from '@app/shared/types/error-type';

type AddServiceAccountBindingControls = {
  serviceAccountID: string;
  roleID: string;
  roleNamespace?: string;
};

enum BindingMode {
  Cluster = 'Cluster',
  Namespace = 'Namespace',
}

enum Controls {
  ServiceAccountID = 'serviceAccountID',
  RoleID = 'roleID',
  RoleNamespace = 'roleNamespace',
}

enum ServiceAccountsState {
  Ready = 'Service Account',
  Loading = 'Loading...',
  Empty = 'No Service Accounts Available',
}

enum RoleState {
  Ready = 'Role',
  Loading = 'Loading...',
  Empty = 'No Roles available',
}

enum NamespaceState {
  Ready = 'Namespace',
  Loading = 'Loading...',
  Empty = 'No Namespaces available',
}

@Component({
    selector: 'km-add-service-account-binding-dialog',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    standalone: false
})
export class AddServiceAccountBindingDialogComponent implements OnInit, OnDestroy {
  private readonly _unsubscribe = new Subject<void>();
  readonly BindingMode = BindingMode;
  readonly Controls = Controls;
  readonly ErrorType = ErrorType;

  bindingModeControl = new FormControl(BindingMode.Cluster);
  namespaces: string[] = [];
  namespaceRoles: string[] = [];
  namespaceLabel = NamespaceState.Ready;
  clusterRoles: string[] = [];
  roles: string[] = [];
  roleLabel = RoleState.Ready;
  roleNamespacesMap: Record<string, string[]>; // Record of roleId and Namespaces associated with that role
  serviceAccounts: ClusterServiceAccount[] = [];
  serviceAccountsLabel = ServiceAccountsState.Ready;
  form: FormGroup<ControlsOf<AddServiceAccountBindingControls>>;

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() clusterServiceAccount?: ClusterServiceAccount;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _matDialogRef: MatDialogRef<AddServiceAccountBindingDialogComponent>,
    private readonly _notificationService: NotificationService,
    private readonly _clusterServiceAccountService: ClusterServiceAccountService
  ) {}

  ngOnInit(): void {
    this._initForm();
    this._getServiceAccounts();
    this._getNamespaceRoles();
    this._getClusterRoles();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getObservable(): Observable<Record<string, never>> {
    if (this.form.invalid) {
      return of(null);
    }

    const {serviceAccountID: serviceAccountID, roleNamespace, roleID} = this.form.value;

    const serviceAccount = this.serviceAccounts.find(({id}) => id === serviceAccountID);

    return this.bindingModeControl.value === BindingMode.Namespace
      ? this._clusterServiceAccountService.bindServiceAccountToNamespace(
          this.projectID,
          this.cluster.id,
          roleNamespace,
          roleID,
          serviceAccount
        )
      : this._clusterServiceAccountService.bindServiceAccountToCluster(
          this.projectID,
          this.cluster.id,
          roleID,
          serviceAccount
        );
  }

  onNext(serviceAccount: ClusterBinding): void {
    this._matDialogRef.close(serviceAccount);
    this._notificationService.success(`Added binding to ${serviceAccount.roleRefName}`);
  }

  private _initForm(): void {
    this.form = this._builder.nonNullable.group({
      [Controls.ServiceAccountID]: this._builder.control<string>(this.clusterServiceAccount?.name ?? null, [
        Validators.required,
      ]),
      [Controls.RoleID]: this._builder.control<string>(null, [Validators.required]),
    });

    this.bindingModeControl.valueChanges
      .pipe(startWith(this.bindingModeControl.value), takeUntil(this._unsubscribe))
      .subscribe(bindingMode => {
        this.form.controls.roleID.reset();
        this._setRoles();
        if (bindingMode === BindingMode.Cluster) {
          this.form.removeControl('roleNamespace');
        } else {
          this.form.addControl('roleNamespace', this._builder.control<string>(null, [Validators.required]));
        }
      });
  }

  private _getServiceAccounts(): void {
    this.serviceAccountsLabel = ServiceAccountsState.Loading;
    this._clusterServiceAccountService
      .get(this.projectID, this.cluster.id)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(serviceAccounts => {
        this.serviceAccounts = serviceAccounts;
        this.serviceAccountsLabel = serviceAccounts.length ? ServiceAccountsState.Ready : ServiceAccountsState.Empty;
      });
  }

  private _getNamespaceRoles(): void {
    this.namespaceLabel = NamespaceState.Loading;
    this._rbacService
      .getNamespaceRoleNames(this.cluster.id, this.projectID)
      .pipe(
        map(roles => _.sortBy(roles, role => role.name.toLowerCase())),
        takeUntil(this._unsubscribe)
      )
      .subscribe(roles => {
        this.namespaceRoles = roles.map(role => role.name);
        this.roleNamespacesMap = roles.reduce((prev, {name, namespace}) => ({...prev, [name]: namespace}), {});
        this._setRoles();
        this.namespaceLabel = roles.length ? NamespaceState.Ready : NamespaceState.Empty;
      });
  }

  private _getClusterRoles(): void {
    this.roleLabel = RoleState.Loading;
    this._rbacService
      .getClusterRoleNames(this.cluster.id, this.projectID)
      .pipe(
        map(clusterRoles => clusterRoles.map(clusterRole => clusterRole.name)),
        map(clusterRoles => _.sortBy(clusterRoles, clusterRole => clusterRole.toLowerCase())),
        takeUntil(this._unsubscribe)
      )
      .subscribe(clusterRoles => {
        this.clusterRoles = clusterRoles;
        this._setRoles();
      });
  }

  private _setRoles(): void {
    this.roles = this.bindingModeControl.value === BindingMode.Cluster ? this.clusterRoles : this.namespaceRoles;
    this.roleLabel = this.roles.length ? RoleState.Ready : RoleState.Empty;
  }
}
