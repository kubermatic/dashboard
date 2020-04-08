import {Component, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {Subject, timer} from 'rxjs';
import {retry, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ApiService, NotificationService, ProjectService, UserService} from '../core/services';
import {SettingsService} from '../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {AddSshKeyDialogComponent} from '../shared/components/add-ssh-key-dialog/add-ssh-key-dialog.component';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {SSHKeyEntity} from '../shared/entity/SSHKeyEntity';
import {UserGroupConfig} from '../shared/model/Config';

@Component({
  selector: 'km-sshkey',
  templateUrl: './sshkey.component.html',
  styleUrls: ['./sshkey.component.scss'],
})

export class SSHKeyComponent implements OnInit, OnChanges, OnDestroy {
  loading = true;
  sshKeys: SSHKeyEntity[] = [];
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  projectID: string;
  isShowPublicKey = [];
  displayedColumns: string[] = ['stateArrow', 'name', 'fingerprint', 'creationTimestamp', 'actions'];
  toggledColumns: string[] = ['publickey'];
  dataSource = new MatTableDataSource<SSHKeyEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _api: ApiService, private readonly _userService: UserService,
      private readonly _appConfigService: AppConfigService, public dialog: MatDialog,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _projectService: ProjectService, private readonly _notificationService: NotificationService,
      private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this.userGroupConfig = this._appConfigService.getUserGroupConfig();
    this.dataSource.data = this.sshKeys;
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator;  // Force refresh.
    });

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this.projectID = project.id;
          return this._userService.currentUserGroup(this.projectID);
        }))
        .pipe(switchMap(group => {
          this.userGroup = group;
          return timer(0, 10 * this._appConfigService.getRefreshTimeBase());
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(() => this.refreshSSHKeys());
  }

  ngOnChanges(): void {
    this.dataSource.data = this.sshKeys;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getPublicKeyName(sshKey: SSHKeyEntity): string {
    return sshKey.spec.publicKey.split(' ')[0];
  }

  getPublicKey(sshKey: SSHKeyEntity): string {
    return sshKey.spec.publicKey.slice(this.getPublicKeyName(sshKey).length + 1, -1);
  }

  refreshSSHKeys(): void {
    this._api.getSSHKeys(this.projectID).pipe(retry(3)).pipe(takeUntil(this._unsubscribe)).subscribe((res) => {
      this.sshKeys = res;
      this.dataSource.data = this.sshKeys;
      this.loading = false;
    });
  }

  addSshKey(): void {
    const dialogRef = this.dialog.open(AddSshKeyDialogComponent);
    dialogRef.componentInstance.projectID = this.projectID;

    dialogRef.afterClosed().subscribe((result) => {
      result && this.refreshSSHKeys();  // tslint:disable-line
    });
  }

  deleteSshKey(sshKey: SSHKeyEntity, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        dialogId: 'km-delete-sshkey-dialog',
        title: 'Delete SSH Key',
        message: `Delete SSH key "<strong>${sshKey.name}</strong>" permanently?`,
        confirmLabel: 'Delete',
        confirmLabelId: 'km-delete-sshkey-dialog-btn',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('sshKeyOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._api.deleteSSHKey(sshKey.id, this.projectID).subscribe(() => {
          this._notificationService.success(`SSH key ${sshKey.name} has been removed from project ${this.projectID}`);
          this._googleAnalyticsService.emitEvent('sshKeyOverview', 'SshKeyDeleted');
        });
      }
    });
  }

  togglePublicKey(element: SSHKeyEntity): void {
    this.isShowPublicKey[element.id] = !this.isShowPublicKey[element.id];
  }

  hasItems(): boolean {
    return this.sshKeys && this.sshKeys.length > 0;
  }

  isPaginatorVisible(): boolean {
    return this.hasItems() && this.paginator && this.sshKeys.length > this.paginator.pageSize;
  }
}
