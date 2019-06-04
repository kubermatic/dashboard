import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {ApiService, ProjectService, UserService} from '../../../core/services';
import {WizardService} from '../../../core/services/wizard/wizard.service';
import {AddSshKeyDialogComponent} from '../../../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {GroupConfig} from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-ssh-keys',
  templateUrl: './cluster-ssh-keys.component.html',
  styleUrls: ['cluster-ssh-keys.component.scss'],
})
export class ClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() selectedKeys: SSHKeyEntity[] = [];
  keys: SSHKeyEntity[] = [];
  keysForm: FormGroup = new FormGroup({
    keys: new FormControl([], []),
  });
  project = {} as ProjectEntity;
  groupConfig: GroupConfig;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _api: ApiService, private readonly _wizardService: WizardService,
      private readonly _dialog: MatDialog, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.project.id = this._activeRoute.snapshot.paramMap.get('projectID');

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(project => {
          this.project = project;
          return this._userService.getCurrentUserGroup(this.project.id);
        }))
        .subscribe(group => this.groupConfig = this._userService.getUserGroupConfig(group));

    this._projectService.onProjectChange.subscribe((project) => {
      this.project = project;
    });

    this.keysForm.controls.keys.patchValue(this.selectedKeys);
    this.keysForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this.setClusterSSHKeysSpec());
    this.reloadKeys();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  reloadKeys(): void {
    this._api.getSSHKeys(this.project.id).pipe(first()).subscribe((sshKeys) => {
      this.keys = sshKeys.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      this.setClusterSSHKeysSpec();
    });
  }

  addSshKeyDialog(): void {
    const dialogRef = this._dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.project.id;

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
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
    this._wizardService.changeClusterSSHKeys(clusterKeys);
  }

  compareValues(value1: SSHKeyEntity, value2: SSHKeyEntity): boolean {
    return value1 && value2 ? value1.id === value2.id : value1 === value2;
  }
}
