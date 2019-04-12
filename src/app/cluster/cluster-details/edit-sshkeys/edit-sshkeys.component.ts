import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, Sort} from '@angular/material';
import {find} from 'lodash';
import {Subject, timer} from 'rxjs';
import {retry, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../app-config.service';
import {ApiService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {AddClusterSSHKeysComponent} from './add-cluster-sshkeys/add-cluster-sshkeys.component';

@Component({
  selector: 'kubermatic-edit-sshkeys',
  templateUrl: './edit-sshkeys.component.html',
  styleUrls: ['./edit-sshkeys.component.scss'],
})

export class EditSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  loading = true;
  sshKeys: SSHKeyEntity[] = [];
  sortedSshKeys: SSHKeyEntity[] = [];
  sort: Sort = {active: 'name', direction: 'asc'};
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private api: ApiService, private userService: UserService, private appConfigService: AppConfigService,
      public dialog: MatDialog) {}

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });

    timer(0, 5000).pipe(takeUntil(this._unsubscribe)).subscribe(() => this.refreshSSHKeys());
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  refreshSSHKeys(): void {
    this.api.getClusterSSHKeys(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(retry(3))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((res) => {
          this.sshKeys = res;
          this.sortSshKeyData(this.sort);
          this.loading = false;
        });
  }

  addSshKey(): void {
    const dialogRef = this.dialog.open(AddClusterSSHKeysComponent);
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.sshKeys = this.sshKeys;

    dialogRef.afterClosed().subscribe((result) => {
      result && this.refreshSSHKeys();  // tslint:disable-line
    });
  }

  trackSshKey(index: number, shhKey: SSHKeyEntity): number {
    const prevSSHKey = find(this.sshKeys, (item) => {
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
