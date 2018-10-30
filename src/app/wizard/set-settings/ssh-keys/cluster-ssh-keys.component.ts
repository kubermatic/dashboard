import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { Subscription } from 'rxjs';
import { AppConfigService } from '../../../app-config.service';
import { ApiService, ProjectService, UserService } from '../../../core/services';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { AddSshKeyModalComponent } from '../../../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';
import { UserGroupConfig } from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-ssh-keys',
  templateUrl: './cluster-ssh-keys.component.html',
  styleUrls: ['./cluster-ssh-keys.component.scss']
})
export class ClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() selectedKeys: SSHKeyEntity[] = [];
  public keys: SSHKeyEntity[] = [];
  public keysForm: FormGroup = new FormGroup({
    keys: new FormControl([], []),
  });
  private keysSub: Subscription;
  private keysFormSub: Subscription;
  public project: ProjectEntity;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private wizardService: WizardService,
              private dialog: MatDialog,
              private projectService: ProjectService,
              private userService: UserService,
              private appConfigService: AppConfigService) { }

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe(group => {
        this.userGroup = group;
      });
    }));

    const keyNames: string[] = [];
    for (const key of this.selectedKeys) {
      keyNames.push(key.name);
    }
    this.keysForm.controls.keys.patchValue(keyNames);

    this.keysFormSub = this.keysForm.valueChanges.subscribe(data => {
      this.setClusterSSHKeysSpec();
    });

    this.reloadKeys();
  }

  ngOnDestroy(): void {
    this.keysSub.unsubscribe();
    this.keysFormSub.unsubscribe();
  }

  reloadKeys(): void {
    this.keysSub = this.api.getSSHKeys(this.project.id).subscribe(sshKeys => {
      this.keys = sshKeys.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      this.setClusterSSHKeysSpec();
    });
  }

  public addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);
    dialogRef.componentInstance.projectID = this.project.id;

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.keysSub) {
          this.keysSub.unsubscribe();
        }
        this.reloadKeys();
        this.keysForm.controls.keys.patchValue([result.name]);
      }
    });
  }

  public setClusterSSHKeysSpec(): void {
    const clusterKeys: SSHKeyEntity[] = [];
    for (const selectedKey of this.keysForm.controls.keys.value) {
      for (const key of this.keys) {
        if (selectedKey === key.name) {
          clusterKeys.push(key);
        }
      }
    }
    this.wizardService.changeClusterSSHKeys(clusterKeys);
  }
}
