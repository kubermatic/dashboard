import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {EMPTY, Subject, timer} from 'rxjs';
import {first, merge, switchMap, takeUntil} from 'rxjs/operators';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ServiceAccountEntity, ServiceAccountTokenEntity} from '../shared/entity/ServiceAccountEntity';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';
import {AddServiceAccountComponent} from './add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from './edit-serviceaccount/edit-serviceaccount.component';
import {TokenDialogComponent} from './token-dialog/token-dialog.component';

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
  toggledColumns: string[] = ['token'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort) sort: MatSort;
  shouldToggleToken = (index, item) => this.isShowToken[item.id];
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
    return ProjectUtils.getStateIconClass(status);
  }

  getGroupDisplayName(group: string): string {
    return MemberUtils.getGroupDisplayName(group);
  }

  isEnabled(action: string, type: string): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup][type][action];
  }

  toggleToken(element: ServiceAccountEntity): void {
    this.isShowToken[element.id] = !this.isShowToken[element.id];
  }

  addServiceAccount(): void {
    const modal = this._matDialog.open(AddServiceAccountComponent);
    modal.componentInstance.project = this._projectService.project;

    modal.afterClosed().pipe(first()).subscribe((isAdded) => {
      if (isAdded) {
        this._externalServiceAccountUpdate.next();
      }
    });
  }

  editServiceAccount(serviceAccount: ServiceAccountEntity, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.serviceaccount = serviceAccount;
    modal.afterClosed().pipe(first()).subscribe((isEdited) => {
      if (isEdited) {
        this._externalServiceAccountUpdate.next();
      }
    });
  }

  deleteServiceAccount(serviceAccount: ServiceAccountEntity, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove Service Account from project',
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

  addServiceAccountToken(serviceAccount: ServiceAccountEntity, event: Event): void {
    event.stopPropagation();
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Add Token to Service Account',
        message: `You are on the way to add a new Token to the Service Account ${serviceAccount.name}.`,
        confirmLabel: 'Add',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'addServiceAccountTokenOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.createServiceAccountToken(this._projectService.project.id, serviceAccount)
            .pipe(first())
            .subscribe((token) => {
              this.openTokenDialog(token);
              NotificationActions.success(
                  'Success', `Token ${token.name} has been added to Service Account ${serviceAccount.name}`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenAdded');
            });
      }
    });
  }

  openTokenDialog(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
  }
}
