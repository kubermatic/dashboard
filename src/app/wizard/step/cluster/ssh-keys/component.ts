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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {filter, first, switchMap, take, takeUntil, tap} from 'rxjs/operators';

import {ApiService, ProjectService, UserService} from '../../../../core/services';
import {AddSshKeyDialogComponent} from '../../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {View} from '../../../../shared/entity/common';
import {Member} from '../../../../shared/entity/member';
import {Project} from '../../../../shared/entity/project';
import {SSHKey} from '../../../../shared/entity/ssh-key';
import {GroupConfig} from '../../../../shared/model/Config';
import {ClusterService} from '../../../../shared/services/cluster.service';
import {MemberUtils, Permission} from '../../../../shared/utils/member-utils/member-utils';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import * as _ from 'lodash';

enum Controls {
  Keys = 'keys',
}

@Component({
  selector: 'km-wizard-cluster-ssh-keys',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ClusterSSHKeysComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ClusterSSHKeysComponent),
      multi: true,
    },
  ],
})
export class ClusterSSHKeysComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  private _keys: SSHKey[] = [];
  private _project = {} as Project;
  private _user: Member;
  private _groupConfig: GroupConfig;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _apiService: ApiService,
    private readonly _clusterService: ClusterService,
    private readonly _dialog: MatDialog,
    private readonly _builder: FormBuilder,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {
    super();
  }

  set keys(keys: SSHKey[]) {
    this._keys = _.sortBy(keys, k => k.name.toLowerCase());
  }

  get keys(): SSHKey[] {
    return this._keys;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Keys]: this._builder.control([]),
    });

    this._userService.currentUser.pipe(first()).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(tap(project => (this._project = project)))
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._project.id)))
      .pipe(tap(group => (this._groupConfig = this._userService.getCurrentUserGroupConfig(group))))
      .pipe(switchMap(_ => this._apiService.getSSHKeys(this._project.id)))
      .pipe(first())
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(sshKeys => (this.keys = sshKeys));

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterService.sshKeys = this._getSelectedKeys()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addSSHKeyDialog(): void {
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this._project.id;

    dialogRef
      .afterClosed()
      .pipe(filter(result => result))
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(result => {
        this._keys.push(result);
        this.form.get(Controls.Keys).setValue([...this.form.get(Controls.Keys).value, result]);
        this._changeDetectorRef.detectChanges();
      });
  }

  compareValues(a: SSHKey, b: SSHKey): boolean {
    return a && b ? a.id === b.id : a === b;
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._groupConfig, View.SSHKeys, Permission.Create);
  }

  hasKeys(): boolean {
    return !_.isEmpty(this.keys);
  }

  private _getSelectedKeys(): SSHKey[] {
    return this.form.get(Controls.Keys).value;
  }
}
