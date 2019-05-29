import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {EMPTY, merge, Subject, timer} from 'rxjs';
import {first, switchMap, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {ServiceAccountEntity} from '../shared/entity/ServiceAccountEntity';
import {GroupConfig} from '../shared/model/Config';
import {MemberUtils} from '../shared/utils/member-utils/member-utils';
import {ProjectUtils} from '../shared/utils/project-utils/project-utils';
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
  isShowToken = [];
  tokenList = [];
  isTokenInitializing = [];
  displayedColumns: string[] = ['stateArrow', 'status', 'name', 'group', 'creationDate', 'actions'];
  toggledColumns: string[] = ['token'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  shouldToggleToken = (index, item) => this.isShowToken[item.id];
  private _unsubscribe: Subject<any> = new Subject();
  private _serviceAccountUpdate: Subject<any> = new Subject();
  private _selectedProject = {} as ProjectEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog, private readonly _appConfig: AppConfigService) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.getCurrentUserGroup(project.id);
        }))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.getUserGroupConfig(userGroup));

    merge(timer(0, 10 * this._appConfig.getRefreshTimeBase()), this._serviceAccountUpdate)
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._apiService.getServiceAccounts(this._selectedProject.id)))
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

  isEnabled(action: string): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.serviceaccounts[action];
  }

  toggleToken(element: ServiceAccountEntity): void {
    this.isShowToken[element.id] = !this.isShowToken[element.id];
    if (!!this.isShowToken) {
      this.getTokenList(element);
      this.isTokenInitializing[element.id] = true;
    }
  }

  getTokenList(serviceaccount: ServiceAccountEntity): void {
    this.tokenList[serviceaccount.id] = [];
    timer(0, 10 * this._appConfig.getRefreshTimeBase())
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(
            () => !!this.tokenList[serviceaccount.id] ?
                this._apiService.getServiceAccountTokens(this._selectedProject.id, serviceaccount) :
                EMPTY))
        .subscribe(tokens => {
          this.tokenList[serviceaccount.id] = tokens;
          this.isTokenInitializing[serviceaccount.id] = false;
        });
  }

  addServiceAccount(): void {
    const modal = this._matDialog.open(AddServiceAccountComponent);
    modal.componentInstance.project = this._selectedProject;

    modal.afterClosed().pipe(first()).subscribe((isAdded) => {
      if (isAdded) {
        this._serviceAccountUpdate.next();
      }
    });
  }

  editServiceAccount(serviceAccount: ServiceAccountEntity, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = serviceAccount;
    modal.afterClosed().pipe(first()).subscribe((isEdited) => {
      if (isEdited) {
        this._serviceAccountUpdate.next();
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
        this._apiService.deleteServiceAccount(this._selectedProject.id, serviceAccount).pipe(first()).subscribe(() => {
          delete this.tokenList[serviceAccount.id];
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
