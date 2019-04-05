import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material';
import {Subscription} from 'rxjs';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService, UserService} from '../../../core/services';
import {WizardService} from '../../../core/services/wizard/wizard.service';
import {AddSshKeyDialogComponent} from '../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {UserGroupConfig} from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-ssh-keys',
  templateUrl: './cluster-ssh-keys.component.html',
})
export class ClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() selectedKeys: SSHKeyEntity[] = [];
  keys: SSHKeyEntity[] = [];
  keysForm: FormGroup = new FormGroup({
    keys: new FormControl([], []),
  });
  private keysSub: Subscription;
  private keysFormSub: Subscription;
  project: ProjectEntity;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private wizardService: WizardService, private dialog: MatDialog,
      private projectService: ProjectService, private userService: UserService,
      private appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    this.keysForm.controls.keys.patchValue(this.selectedKeys);

    this.keysFormSub = this.keysForm.valueChanges.subscribe((data) => {
      this.setClusterSSHKeysSpec();
    });

    this.reloadKeys();
  }

  ngOnDestroy(): void {
    this.keysSub.unsubscribe();
    this.keysFormSub.unsubscribe();
  }

  reloadKeys(): void {
    this.keysSub = this.api.getSSHKeys(this.project.id).subscribe((sshKeys) => {
      this.keys = sshKeys.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      this.setClusterSSHKeysSpec();
    });
  }

  addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.project.id;

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (this.keysSub) {
          this.keysSub.unsubscribe();
        }
        this.reloadKeys();
        const newValue = this.keysForm.controls.keys.value;
        newValue.push(result);
        this.keysForm.controls.keys.patchValue(newValue);
      }
    });
  }

  setClusterSSHKeysSpec(): void {
    const clusterKeys: SSHKeyEntity[] = [];
    for (const selectedKey of this.keysForm.controls.keys.value) {
      for (const key of this.keys) {
        if (selectedKey.id === key.id) {
          clusterKeys.push(key);
        }
      }
    }
    this.wizardService.changeClusterSSHKeys(clusterKeys);
  }

  compareValues(value1: SSHKeyEntity, value2: SSHKeyEntity): boolean {
    return value1 && value2 ? value1.id === value2.id : value1 === value2;
  }
}
