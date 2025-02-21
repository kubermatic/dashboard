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

import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';

import {AddSshKeyDialogComponent} from '@shared/components/add-ssh-key-dialog/component';
import {View} from '@shared/entity/common';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {SSHKey} from '@shared/entity/ssh-key';
import {GroupConfig} from '@shared/model/Config';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {MemberUtils, Permission} from '@shared/utils/member';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {filter, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {SSHKeyService} from '@core/services/ssh-key';

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
    standalone: false
})
export class ClusterSSHKeysComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  private _project = {} as Project;
  private _user: Member;
  private _groupConfig: GroupConfig;

  constructor(
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _sshKeyService: SSHKeyService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _dialog: MatDialog,
    private readonly _builder: FormBuilder,
    private readonly _changeDetectorRef: ChangeDetectorRef
  ) {
    super();
  }

  private _keys: SSHKey[] = [];

  get keys(): SSHKey[] {
    return this._keys;
  }

  set keys(keys: SSHKey[]) {
    this._keys = _.sortBy(keys, k => k.name.toLowerCase());
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Keys]: this._builder.control([]),
    });

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(tap(project => (this._project = project)))
      .pipe(switchMap(_ => this._userService.getCurrentUserGroup(this._project.id)))
      .pipe(tap(group => (this._groupConfig = this._userService.getCurrentUserGroupConfig(group))))
      .pipe(switchMap(_ => this._sshKeyService.list(this._project.id)))
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(sshKeys => (this.keys = sshKeys));

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => (this._clusterSpecService.sshKeys = this._getSelectedKeys()));
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

  writeValue(keys: SSHKey[]): void {
    this.form.get(Controls.Keys).setValue(keys, {emitEvent: false});
  }

  private _getSelectedKeys(): SSHKey[] {
    return this.form.get(Controls.Keys).value;
  }
}
