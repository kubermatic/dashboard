import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subscription } from 'rxjs';
import { AppConfigService } from '../../../../app-config.service';
import { ApiService, UserService } from '../../../../core/services';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { AddSshKeyModalComponent } from '../../../../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { SSHKeyEntity } from '../../../../shared/entity/SSHKeyEntity';
import { UserGroupConfig } from '../../../../shared/model/Config';

@Component({
  selector: 'kubermatic-add-cluster-sshkeys',
  templateUrl: './add-cluster-sshkeys.component.html',
  styleUrls: ['./add-cluster-sshkeys.component.scss']
})
export class AddClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() projectID: string;
  @Input() datacenter: DataCenterEntity;
  @Input() sshKeys: SSHKeyEntity[] = [];

  public keys: SSHKeyEntity[] = [];
  public keysForm: FormGroup = new FormGroup({
    keys: new FormControl('', [Validators.required]),
  });
  private keysSub: Subscription;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;

  constructor(private api: ApiService,
              private dialog: MatDialog,
              private appConfigService: AppConfigService,
              private userService: UserService,
              private dialogRef: MatDialogRef<AddClusterSSHKeysComponent>) { }

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe(group => {
      this.userGroup = group;
    });

    this.reloadKeys();
  }

  ngOnDestroy(): void {
    if (!!this.keysSub) {
      this.keysSub.unsubscribe();
    }
  }

  reloadKeys(): void {
    this.keysSub = this.api.getSSHKeys(this.projectID).subscribe(sshKeysRes => {
      const newKeys: SSHKeyEntity[] = [];
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

  public addClusterSSHKeys(): void {
    this.api.addClusterSSHKey(this.keysForm.controls.keys.value, this.cluster.id, this.datacenter.metadata.name, this.projectID).subscribe(res => {
      NotificationActions.success('Success', `SSH key ${this.keysForm.controls.keys.value} was successfully added to cluster`);
      this.dialogRef.close(res);
    });
  }

  public addProjectSSHKeys(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);
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
