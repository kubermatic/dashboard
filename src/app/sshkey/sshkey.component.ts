import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort, MatDialog, MatTabChangeEvent } from '@angular/material';
import { Observable, ObservableInput } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { find } from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { ApiService, ProjectService } from '../core/services';
import { NotificationActions } from '../redux/actions/notification.actions';
import { Router } from '@angular/router';
import { ProjectEntity } from '../shared/entity/ProjectEntity';
import { AddSshKeyModalComponent } from '../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { SSHKeyEntity } from '../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-sshkey',
  templateUrl: './sshkey.component.html',
  styleUrls: ['./sshkey.component.scss']
})

export class SSHKeyComponent implements OnInit, OnDestroy {
  public project: ProjectEntity;
  public sshKeys: Array<SSHKeyEntity> = [];
  public sortedSshKeys: SSHKeyEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  private subscriptions: Subscription[] = [];

  constructor(private router: Router,
              private api: ApiService,
              private projectService: ProjectService,
              public dialog: MatDialog) { }

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    const timer = Observable.interval(10000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshSSHKeys();
    }));
    this.refreshSSHKeys();
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshSSHKeys() {
    if (this.project) {
      this.subscriptions.push(this.api.getSSHKeys(this.project.id).retry(3).subscribe(res => {
        this.sshKeys = res;
        this.sortSshKeyData(this.sort);
      }));
    }
  }

  public addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);
    dialogRef.componentInstance.project = this.project;

    dialogRef.afterClosed().subscribe(result => {
      result && this.refreshSSHKeys();
    });
  }

  public trackSshKey(index: number, shhKey: SSHKeyEntity): number {
    const prevSSHKey = find(this.sshKeys, item => {
      return item.name === shhKey.name;
    });

    return prevSSHKey === shhKey ? index : undefined;
  }

  sortSshKeyData(sort: Sort) {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedSshKeys = this.sshKeys;
      return;
    }

    this.sort = sort;

    this.sortedSshKeys = this.sshKeys.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'status':
          return this.compare(a.spec.fingerprint, b.spec.fingerprint, isAsc);
        default:
          return 0;
      }
    });
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
