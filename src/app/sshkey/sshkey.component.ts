import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute} from '@angular/router';
import {interval, Subscription} from 'rxjs';
import {retry} from 'rxjs/operators';
import {AppConfigService} from '../app-config.service';
import {ApiService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {AddSshKeyDialogComponent} from '../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {SSHKeyEntity} from '../shared/entity/SSHKeyEntity';
import {UserGroupConfig} from '../shared/model/Config';

@Component({
  selector: 'kubermatic-sshkey',
  templateUrl: './sshkey.component.html',
  styleUrls: ['./sshkey.component.scss'],
})

export class SSHKeyComponent implements OnInit, OnDestroy {
  loading = true;
  sshKeys: SSHKeyEntity[] = [];
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  projectID: string;
  isShowPublicKey = [];
  displayedColumns: string[] = ['name', 'fingerprint', 'actions'];
  toggledColumns: string[] = ['publickey'];
  dataSource = new MatTableDataSource<SSHKeyEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];
  shouldTogglePublicKey = (index, item) => this.isShowPublicKey[item.id];

  constructor(
      private route: ActivatedRoute, private api: ApiService, private userService: UserService,
      private appConfigService: AppConfigService, public dialog: MatDialog,
      private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.route.paramMap.subscribe((m) => {
      this.projectID = m.get('projectID');
      this.refreshSSHKeys();
    }));

    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    const timer = interval(10000);
    this.subscriptions.push(timer.subscribe(() => {
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

  getDataSource(): MatTableDataSource<SSHKeyEntity> {
    this.dataSource.data = this.sshKeys;
    return this.dataSource;
  }

  getPublicKeyName(sshKey: SSHKeyEntity): string {
    return sshKey.spec.publicKey.split(' ')[0];
  }

  getPublicKey(sshKey: SSHKeyEntity): string {
    return sshKey.spec.publicKey.slice(this.getPublicKeyName(sshKey).length + 1, -1);
  }

  refreshSSHKeys(): void {
    this.subscriptions.push(this.api.getSSHKeys(this.projectID).pipe(retry(3)).subscribe((res) => {
      this.sshKeys = res;
      this.loading = false;
    }));
  }

  addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef.afterClosed().subscribe((result) => {
      result && this.refreshSSHKeys();  // tslint:disable-line
    });
  }

  deleteSshKey(sshKey: SSHKeyEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        dialogId: 'km-delete-sshkey-dialog',
        title: 'Remove SSH key from project',
        message: `You are on the way to remove the SSH key ${sshKey.name} from the project. This cannot be undone!`,
        confirmLabel: 'Delete',
        confirmLabelId: 'km-delete-sshkey-dialog-btn',
        cancelLabel: 'Close',
        cancelLabelId: 'km-close-sshkey-dialog-btn',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('sshKeyOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteSSHKey(sshKey.id, this.projectID).subscribe(() => {
          NotificationActions.success(
              'Success', `SSH key ${sshKey.name} has been removed from project ${this.projectID}`);
          this.googleAnalyticsService.emitEvent('sshKeyOverview', 'SshKeyDeleted');
        });
      }
    });
  }

  togglePublicKey(element: SSHKeyEntity): void {
    this.isShowPublicKey[element.id] = !this.isShowPublicKey[element.id];
  }
}
