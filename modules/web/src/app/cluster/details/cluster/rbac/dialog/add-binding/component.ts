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
import {debounceTime, takeUntil} from 'rxjs/operators';
import {Cluster} from '@shared/entity/cluster';
import {NotificationService} from '@core/services/notification';
import {RBACService} from '@core/services/rbac';
import {Binding, ClusterBinding, ClusterRoleName, CreateBinding, Kind, RoleName} from '@shared/entity/rbac';

export enum Controls {
  Email = 'email',
  Group = 'group',
  Role = 'role',
  Namespace = 'namespace',
}

@Component({
  selector: 'km-add-binding',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class AddBindingComponent implements OnInit, OnDestroy {
  readonly Kind = Kind;
  readonly controls = Controls;

  bindingType = 'cluster';
  clusterRoles: ClusterRoleName[] = [];
  roles: RoleName[] = [];
  form: FormGroup;

  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() subjectType = Kind.User;

  private readonly _debounceTime = 1000;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _rbacService: RBACService,
    private readonly _matDialogRef: MatDialogRef<AddBindingComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Email]: new FormControl('', [Validators.required]),
      [Controls.Group]: new FormControl(''),
      [Controls.Role]: new FormControl('', [Validators.required]),
      [Controls.Namespace]: new FormControl(''),
    });

    this._rbacService
      .getClusterRoleNames(this.cluster.id, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(clusterRoles => (this.clusterRoles = _.sortBy(clusterRoles, cr => cr.name.toLowerCase())));

    this._rbacService
      .getNamespaceRoleNames(this.cluster.id, this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(roles => (this.roles = _.sortBy(roles, r => r.name.toLowerCase())));

    this.form.controls.role.valueChanges
      .pipe(debounceTime(this._debounceTime))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        if (this.bindingType === 'namespace') {
          this.checkNamespaceState();
        }
      });

    this.setValidators();
    this.checkNamespaceState();
    this.changeSubjectType();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  changeView(event: MatButtonToggleChange): void {
    this.bindingType = event.value;
    this.setValidators();
    this.checkNamespaceState();
  }

  changeSubjectType(): void {
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

  setValidators(): void {
    if (this.bindingType === 'cluster') {
      this.form.get(Controls.Namespace).clearValidators();
    } else {
      this.form.get(Controls.Namespace).setValidators([Validators.required]);
    }
    this.form.get(Controls.Namespace).updateValueAndValidity();
  }

  getRoleFormState(): string {
    let roleLength = 0;
    if (!!this.clusterRoles || !!this.roles) {
      roleLength = this.bindingType === 'cluster' ? this.clusterRoles.length : this.roles.length;
    }

    if (roleLength) {
      return 'Role';
    } else if (!roleLength) {
      return 'No Roles available';
    }
    return 'Role';
  }

  getNamespaceFormState(): string {
    const roleLength = this.roles ? this.roles.length : 0;

    if (this.form.get(Controls.Role).value !== '') {
      return 'Namespace';
    } else if (this.form.get(Controls.Role).value === '' && !!roleLength) {
      return 'Please select a Role first';
    } else if (!roleLength) {
      return 'No Namespaces available';
    }
    return 'Namespace';
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

  getObservable(): Observable<ClusterBinding | Binding> {
    return this.bindingType === 'cluster' ? this.addClusterBinding() : this.addNamespaceBinding();
  }

  onNext(binding: ClusterBinding | Binding): void {
    this._matDialogRef.close(binding);
    this.bindingType === 'cluster'
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

  addNamespaceBinding(): Observable<Binding> {
    const namespaceBinding: CreateBinding = {};
    if (this.form.controls.email.value) {
      namespaceBinding.userEmail = this.form.controls.email.value;
    }
    if (this.form.controls.group.value) {
      namespaceBinding.group = this.form.controls.group.value;
    }

    return this._rbacService
      .createBinding(
        this.cluster.id,
        this.projectID,
        this.form.controls.role.value,
        this.form.controls.namespace.value,
        namespaceBinding
      )
      .pipe(takeUntil(this._unsubscribe));
  }
}
