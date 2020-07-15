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
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {ApiService, ProjectService, UserService} from '../../../core/services';
import {WizardService} from '../../../core/services';
import {AddSshKeyDialogComponent} from '../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {Cluster} from '../../../shared/entity/cluster';
import {View} from '../../../shared/entity/common';
import {Member} from '../../../shared/entity/member';
import {Project} from '../../../shared/entity/project';
import {SSHKey} from '../../../shared/entity/ssh-key';
import {GroupConfig} from '../../../shared/model/Config';
import {MemberUtils, Permission} from '../../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-cluster-ssh-keys',
  templateUrl: './cluster-ssh-keys.component.html',
  styleUrls: ['cluster-ssh-keys.component.scss'],
})
export class ClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() selectedKeys: SSHKey[] = [];
  keys: SSHKey[] = [];
  keysForm: FormGroup = new FormGroup({
    keys: new FormControl([], []),
  });
  project = {} as Project;
  groupConfig: GroupConfig;

  private _currentUser: Member;
  private _currentGroupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _api: ApiService,
    private readonly _wizardService: WizardService,
    private readonly _dialog: MatDialog,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.project.id = this._activeRoute.snapshot.paramMap.get('projectID');

    this._userService.currentUser.pipe(first()).subscribe(user => (this._currentUser = user));

    this._userService
      .getCurrentUserGroup(this.project.id)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._projectService.selectedProject
      .pipe(takeUntil(this._unsubscribe))
      .pipe(
        switchMap(project => {
          this.project = project;
          return this._userService.getCurrentUserGroup(this.project.id);
        })
      )
      .subscribe(group => (this.groupConfig = this._userService.getCurrentUserGroupConfig(group)));

    this._projectService.onProjectChange.subscribe(project => {
      this.project = project;
    });

    this.keysForm.controls.keys.patchValue(this.selectedKeys);
    this.keysForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => this.setClusterSSHKeysSpec());
    this.reloadKeys();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  reloadKeys(): void {
    this._api
      .getSSHKeys(this.project.id)
      .pipe(first())
      .subscribe(sshKeys => {
        this.keys = sshKeys.sort((a, b) => {
          return a.name.localeCompare(b.name);
        });
        this.setClusterSSHKeysSpec();
      });
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._currentUser, this._currentGroupConfig, View.SSHKeys, Permission.Create);
  }

  addSshKeyDialog(): void {
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.project.id;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reloadKeys();
        const newValue = this.keysForm.controls.keys.value;
        newValue.push(result);
        this.keysForm.controls.keys.patchValue(newValue);
      }
    });
  }

  setClusterSSHKeysSpec(): void {
    const clusterKeys: SSHKey[] = [];
    for (const selectedKey of this.keysForm.controls.keys.value) {
      for (const key of this.keys) {
        if (selectedKey.id === key.id) {
          clusterKeys.push(key);
        }
      }
    }
    this._wizardService.changeClusterSSHKeys(clusterKeys);
  }

  compareValues(value1: SSHKey, value2: SSHKey): boolean {
    return value1 && value2 ? value1.id === value2.id : value1 === value2;
  }
}
