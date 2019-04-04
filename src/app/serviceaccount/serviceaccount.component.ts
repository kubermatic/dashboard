import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {EMPTY, Subject, timer} from 'rxjs';
import {first, merge, switchMap, takeUntil} from 'rxjs/operators';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ServiceAccountEntity} from '../shared/entity/ServiceAccountEntity';
import {AddServiceAccountComponent} from './add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from './edit-serviceaccount/edit-serviceaccount.component';

@Component({
  selector: 'kubermatic-serviceaccount',
  templateUrl: './serviceaccount.component.html',
  styleUrls: ['./serviceaccount.component.scss'],
})

export class ServiceAccountComponent implements OnInit, OnDestroy {
  isInitializing = true;
  serviceAccounts: ServiceAccountEntity[] = [];
  currentUser: MemberEntity;
  isShowToken = [];
  displayedColumns: string[] = ['status', 'name', 'group', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _externalServiceAccountUpdate: Subject<any> = new Subject();

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this._userService.getUser().pipe(first()).subscribe((user) => {
      this.currentUser = user;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';


    timer(0, 5000)
        .pipe(merge(this._externalServiceAccountUpdate))
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(
            () => this._projectService.project ? this._apiService.getServiceAccounts(this._projectService.project.id) :
                                                 EMPTY))
        .subscribe(serviceaccounts => {
          this.serviceAccounts = serviceaccounts;
          this.isInitializing = false;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<ServiceAccountEntity> {
    this.dataSource.data = this.serviceAccounts;
    return this.dataSource;
  }

  getStateIconClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'fa fa-circle green';
      case 'Inactive':
        return 'fa fa-circle-o red';
      case 'Terminating':
        return 'fa fa-spin fa-circle-o-notch orange';
      default:
        return 'fa fa-spin fa-circle-o-notch orange';
    }
  }

  getGroupDisplayName(group: string): string {
    const prefix = group.split('-')[0];
    switch (prefix) {
      case 'owners':
        return 'Owner';
      case 'editors':
        return 'Editor';
      case 'viewers':
        return 'Viewer';
    }
    return '';
  }

  isEnabled(action: string): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].serviceaccounts[action];
  }

  addServiceAccount(): void {
    const modal = this._matDialog.open(AddServiceAccountComponent);
    modal.componentInstance.project = this._projectService.project;

    const sub = modal.afterClosed().pipe(first()).subscribe((added) => {
      if (added) {
        this._externalServiceAccountUpdate.next();
      }
      sub.unsubscribe();
    });
  }

  editServiceAccount(serviceAccount: ServiceAccountEntity): void {
    const modal = this._matDialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.serviceaccount = serviceAccount;
    const sub = modal.afterClosed().pipe(first()).subscribe((edited) => {
      sub.unsubscribe();
    });
  }

  deleteServiceAccount(serviceAccount: ServiceAccountEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove member from project',
        message: `You are on the way to remove the Service Account ${serviceAccount.name} from the project ${
            this._projectService.project.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'deleteServiceAccountOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.deleteServiceAccount(this._projectService.project.id, serviceAccount)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  'Success',
                  `Service Account ${serviceAccount.name} has been removed from project ${
                      this._projectService.project.name}`);
              this._googleAnalyticsService.emitEvent('serviceAccountOverview', 'ServiceAccountDeleted');
            });
      }
    });
  }
}
