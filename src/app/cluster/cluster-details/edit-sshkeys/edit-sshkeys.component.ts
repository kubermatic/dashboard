import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../app-config.service';
import {ClusterService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
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
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  displayedColumns: string[] = ['name', 'actions'];
  dataSource = new MatTableDataSource<SSHKeyEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _sshKeysUpdate: Subject<any> = new Subject();

  constructor(
      private readonly _userService: UserService,
      private readonly _appConfig: AppConfigService,
      private readonly _dialog: MatDialog,
      private readonly _clusterService: ClusterService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService,
  ) {}

  ngOnInit(): void {
    this.userGroupConfig = this._appConfig.getUserGroupConfig();
    this._userService.currentUserGroup(this.projectID).pipe(takeUntil(this._unsubscribe)).subscribe((group) => {
      this.userGroup = group;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    merge(timer(0, 5 * this._appConfig.getRefreshTimeBase()), this._sshKeysUpdate)
        .pipe(switchMap(
            () => this.projectID ?
                this._clusterService.sshKeys(this.projectID, this.cluster.id, this.datacenter.metadata.name) :
                EMPTY))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(sshkeys => {
          this.sshKeys = sshkeys;
          this.loading = false;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<SSHKeyEntity> {
    this.dataSource.data = this.sshKeys;
    return this.dataSource;
  }

  isTableVisible(): boolean {
    return !!this.sshKeys && this.sshKeys.length > 0;
  }

  addSshKey(): void {
    const dialogRef = this._dialog.open(AddClusterSSHKeysComponent);
    dialogRef.componentInstance.projectID = this.projectID;
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.sshKeys = this.sshKeys;

    dialogRef.afterClosed().pipe(first()).subscribe((sshkey: SSHKeyEntity) => {
      if (sshkey) {
        this.sshKeys.push(sshkey);
        this._sshKeysUpdate.next();
      }
    });
  }

  deleteSshKey(sshKey: SSHKeyEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete SSH Key',
        message: `Are you sure you want to permanently delete SSH key"<strong>${sshKey.name}</strong>"
          from cluster "<strong>${this.cluster.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._dialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('clusterOverview', 'deleteSshKeyOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._clusterService.deleteSSHKey(this.projectID, this.cluster.id, this.datacenter.metadata.name, sshKey.id)
            .subscribe(() => {
              NotificationActions.success(`SSH key ${sshKey.name} has been removed from cluster ${this.cluster.name}`);
              this._googleAnalyticsService.emitEvent('clusterOverview', 'SshKeyDeleted');
            });
      }
    });
  }
}
