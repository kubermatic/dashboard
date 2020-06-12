import {ChangeDetectorRef, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {filter, first, switchMap, takeUntil, tap} from 'rxjs/operators';

import {ApiService, ProjectService, UserService} from '../../../../core/services';
import {AddSshKeyDialogComponent} from '../../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {Member} from '../../../../shared/entity/Member';
import {Project} from '../../../../shared/entity/project';
import {SSHKey} from '../../../../shared/entity/ssh-key';
import {GroupConfig} from '../../../../shared/model/Config';
import {MemberUtils, Permission} from '../../../../shared/utils/member-utils/member-utils';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../service/cluster';

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
    this._keys = keys.sort((a, b) => a.name.localeCompare(b.name));
  }

  get keys(): SSHKey[] {
    return this._keys;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Keys]: this._builder.control([]),
    });

    this._userService.loggedInUser.pipe(first()).subscribe(user => (this._user = user));

    this._projectService.selectedProject
      .pipe(tap(project => (this._project = project)))
      .pipe(switchMap(_ => this._userService.currentUserGroup(this._project.id)))
      .pipe(tap(group => (this._groupConfig = this._userService.userGroupConfig(group))))
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
      .pipe(first())
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
    return MemberUtils.hasPermission(this._user, this._groupConfig, 'sshKeys', Permission.Create);
  }

  hasKeys(): boolean {
    return this._keys.length > 0;
  }

  private _getSelectedKeys(): SSHKey[] {
    return this.form.get(Controls.Keys).value;
  }
}
