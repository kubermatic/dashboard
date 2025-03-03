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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {MatButtonToggleChange} from '@angular/material/button-toggle';
import {MatDialogRef} from '@angular/material/dialog';
import _ from 'lodash';
import {Observable, Subject} from 'rxjs';
import {debounceTime, takeUntil, tap} from 'rxjs/operators';
import {Cluster} from '@shared/entity/cluster';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {ClusterBinding, ClusterRoleName, CreateBinding, Kind, NamespaceBinding, RoleName} from '@shared/entity/rbac';
import {ErrorType} from '@app/shared/types/error-type';

export enum Controls {
  Email = 'email',
  Group = 'group',
  Role = 'role',
  Namespace = 'namespace',
}

export enum BindingType {
  Cluster = 'cluster',
  Namespace = 'namespace',
}

enum RoleState {
  Ready = 'Role',
  Loading = 'Loading...',
  Empty = 'No Roles available',
}

enum NamespaceState {
  Ready = 'Namespace',
  Loading = 'Loading...',
  Empty = 'No Namespaces Available',
}

@Component({
  selector: 'km-add-binding-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  standalone: false,
})
export class AddBindingDialogComponent implements OnInit, OnDestroy {
  readonly Kind = Kind;
  readonly Controls = Controls;
  readonly ErrorType = ErrorType;
  readonly BindingType = BindingType;

  bindingType: BindingType = BindingType.Cluster;
  clusterRoles: ClusterRoleName[] = [];
  roles: RoleName[] = [];
  roleLabel = RoleState.Ready;
  form: FormGroup;
  namespaceLabel = NamespaceState.Ready;

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() subjectType = Kind.User;

  private readonly _debounceTime = 1000;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _matDialogRef: MatDialogRef<AddBindingDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Email]: new FormControl('', [Validators.required]),
      [Controls.Group]: new FormControl(''),
      [Controls.Role]: new FormControl('', [Validators.required]),
      [Controls.Namespace]: new FormControl(''),
    });

    this.roleLabel = RoleState.Loading;
    this._rbacService
      .getClusterRoleNames(this.cluster.id, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusterRoles => {
        this.clusterRoles = _.sortBy(clusterRoles, cr => cr.name.toLowerCase());
        this.roleLabel = this.roles ? RoleState.Ready : RoleState.Empty;
      });

    this.roleLabel = RoleState.Loading;
    this._rbacService
      .getNamespaceRoleNames(this.cluster.id, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(roles => {
        this.roles = _.sortBy(roles, r => r.name.toLowerCase());
        this.roleLabel = this.roles ? RoleState.Ready : RoleState.Empty;
      });

    this.form.controls.role.valueChanges
      .pipe(tap(_ => (this.namespaceLabel = NamespaceState.Loading)))
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this.bindingType === BindingType.Namespace) {
          this.checkNamespaceState();
        }
        this.namespaceLabel = this.roles?.length ? NamespaceState.Ready : NamespaceState.Empty;
      });

    this.setNamespaceValidators();
    this.checkNamespaceState();
    this.setSubjectTypeValidators();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  changeView(event: MatButtonToggleChange): void {
    this.bindingType = event.value;
    this.setNamespaceValidators();
    this.checkNamespaceState();
  }

  setSubjectTypeValidators(): void {
    this.form.get(Controls.Email).clearValidators();
    this.form.get(Controls.Group).clearValidators();
    if (this.subjectType === Kind.User) {
      this.form.get(Controls.Email).setValidators([Validators.required]);
    } else {
      this.form.get(Controls.Group).setValidators([Validators.required]);
    }
    this.form.get(Controls.Email).updateValueAndValidity();
    this.form.get(Controls.Group).updateValueAndValidity();
  }

  setNamespaceValidators(): void {
    if (this.bindingType === BindingType.Cluster) {
      this.form.get(Controls.Namespace).clearValidators();
    } else {
      this.form.get(Controls.Namespace).setValidators([Validators.required]);
    }
    this.form.get(Controls.Namespace).updateValueAndValidity();
  }

  checkNamespaceState(): void {
    if (this.form.get(Controls.Role).value === '' && this.form.get(Controls.Namespace).enabled) {
      this.form.get(Controls.Namespace).disable();
    } else if (this.form.get(Controls.Role).value !== '' && this.form.get(Controls.Namespace).disabled) {
      this.form.get(Controls.Namespace).enable();
    }
  }

  getNamespaces(): string[] {
    for (const i in this.roles) {
      if (this.roles[i].name === this.form.get(Controls.Role).value) {
        return this.roles[i].namespace;
      }
    }

    return [];
  }

  getObservable(): Observable<ClusterBinding | NamespaceBinding> {
    return this.bindingType === BindingType.Cluster ? this.addClusterBinding() : this.addNamespaceBinding();
  }

  onNext(binding: ClusterBinding | NamespaceBinding): void {
    this._matDialogRef.close(binding);
    this.bindingType === BindingType.Cluster
      ? this._notificationService.success(
          `Added the ${binding.subjects[binding.subjects.length - 1].name} cluster binding`
        )
      : this._notificationService.success(`Added the ${binding.subjects[binding.subjects.length - 1].name} binding`);
  }

  addClusterBinding(): Observable<ClusterBinding> {
    const clusterBinding: CreateBinding = {};
    if (this.form.controls.email.value) {
      clusterBinding.userEmail = this.form.controls.email.value;
    }
    if (this.form.controls.group.value) {
      clusterBinding.group = this.form.controls.group.value;
    }

    return this._rbacService
      .createClusterBinding(this.cluster.id, this.projectID, this.form.controls.role.value, clusterBinding)
      .pipe(takeUntil(this._unsubscribe));
  }

  addNamespaceBinding(): Observable<NamespaceBinding> {
    const namespaceBinding: CreateBinding = {};
    if (this.form.controls.email.value) {
      namespaceBinding.userEmail = this.form.controls.email.value;
    }
    if (this.form.controls.group.value) {
      namespaceBinding.group = this.form.controls.group.value;
    }

    return this._rbacService
      .createNamespaceBinding(
        this.cluster.id,
        this.projectID,
        this.form.controls.role.value,
        this.form.controls.namespace.value,
        namespaceBinding
      )
      .pipe(takeUntil(this._unsubscribe));
  }
}
