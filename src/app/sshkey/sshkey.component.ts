import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort, MatDialog } from '@angular/material';
import { Subscription, interval } from 'rxjs';
import { retry } from 'rxjs/operators';
import { find } from 'lodash';
import { ApiService, UserService } from '../core/services';
import { AppConfigService } from '../app-config.service';
import { ActivatedRoute } from '@angular/router';
import { AddSshKeyModalComponent } from '../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { SSHKeyEntity } from '../shared/entity/SSHKeyEntity';
import { UserGroupConfig } from '../shared/model/Config';

@Component({
  selector: 'kubermatic-sshkey',
  templateUrl: './sshkey.component.html',
  styleUrls: ['./sshkey.component.scss']
})

export class SSHKeyComponent implements OnInit, OnDestroy {
  public loading = true;
  public sshKeys: Array<SSHKeyEntity> = [];
  public sortedSshKeys: SSHKeyEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];
  public projectID: string;

  constructor(private route: ActivatedRoute,
    private api: ApiService,
    private userService: UserService,
    private appConfigService: AppConfigService,
    public dialog: MatDialog) { }

  public ngOnInit(): void {
    this.projectID = this.route.snapshot.paramMap.get('projectID');

    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe(group => {
      this.userGroup = group;
    });

    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshSSHKeys();
    }));
    this.refreshSSHKeys();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshSSHKeys(): void {
    this.subscriptions.push(this.api.getSSHKeys(this.projectID).pipe(retry(3)).subscribe(res => {
      this.sshKeys = res;
      this.sortSshKeyData(this.sort);
      this.loading = false;
    }));
  }

  public addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);
    dialogRef.componentInstance.projectID = this.projectID;

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

  sortSshKeyData(sort: Sort): void {
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

  compare(a, b, isAsc): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
