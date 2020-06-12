import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService, ClusterService, NotificationService, UserService} from '../../../../core/services';
import {AddSshKeyDialogComponent} from '../../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {Cluster} from '../../../../shared/entity/cluster';
import {Datacenter} from '../../../../shared/entity/datacenter';
import {Member} from '../../../../shared/entity/member';
import {SSHKey} from '../../../../shared/entity/ssh-key';
import {GroupConfig} from '../../../../shared/model/Config';
import {MemberUtils, Permission} from '../../../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-add-cluster-sshkeys',
  templateUrl: './add-cluster-sshkeys.component.html',
  styleUrls: ['./add-cluster-sshkeys.component.scss'],
})
export class AddClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: Cluster;
  @Input() projectID: string;
  @Input() datacenter: Datacenter;
  @Input() sshKeys: SSHKey[] = [];

  keys: SSHKey[] = [];
  keysForm: FormGroup = new FormGroup({
    keys: new FormControl('', [Validators.required]),
  });
  private keysSub: Subscription;
  private _currentGroupConfig: GroupConfig;
  private _user: Member;

  constructor(
    private readonly _clusterService: ClusterService,
    private readonly _dialog: MatDialog,
    private readonly _userService: UserService,
    private readonly _dialogRef: MatDialogRef<AddClusterSSHKeysComponent>,
    private readonly _api: ApiService,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this._userService.loggedInUser.pipe(first()).subscribe(user => (this._user = user));
    this._userService
      .currentUserGroup(this.projectID)
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));

    this.reloadKeys();
  }

  ngOnDestroy(): void {
    if (this.keysSub) {
      this.keysSub.unsubscribe();
    }
  }

  reloadKeys(): void {
    this.keysSub = this._api.getSSHKeys(this.projectID).subscribe(sshKeysRes => {
      const newKeys: SSHKey[] = [];
      for (const i in sshKeysRes) {
        if (!this.sshKeys.find(x => x.name === sshKeysRes[i].name)) {
          newKeys.push(sshKeysRes[i]);
        }
      }
      this.keys = newKeys.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
    });
  }

  canAdd(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'sshKeys', Permission.Create);
  }

  addClusterSSHKeys(): void {
    this._clusterService
      .createSSHKey(this.projectID, this.cluster.id, this.datacenter.metadata.name, this.keysForm.controls.keys.value)
      .subscribe(res => {
        this._notificationService.success(
          `The <strong>${this.keysForm.controls.keys.value}</strong> SSH key was added to the <strong>${this.cluster.name}</strong> cluster`
        );
        this._dialogRef.close(res);
      });
  }

  addProjectSSHKeys(): void {
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.keysSub) {
          this.keysSub.unsubscribe();
        }

        this.reloadKeys();
        this.keysForm.setValue({keys: result.id});
      }
    });
  }
}
