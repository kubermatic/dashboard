import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {filter, first, switchMap} from 'rxjs/operators';

import {ApiService, NotificationService, ProjectService, UserService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {ServiceAccount, ServiceAccountTokenEntity} from '../../shared/entity/service-account';
import {GroupConfig} from '../../shared/model/Config';

import {AddServiceAccountTokenComponent} from './add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from './edit-serviceaccount-token/edit-serviceaccount-token.component';
import {TokenDialogComponent} from './token-dialog/token-dialog.component';

@Component({
  selector: 'km-serviceaccount-token',
  templateUrl: './serviceaccount-token.component.html',
  styleUrls: ['./serviceaccount-token.component.scss'],
})
export class ServiceAccountTokenComponent implements OnInit {
  @Input() serviceaccount: ServiceAccount;
  @Input() serviceaccountTokens: ServiceAccountTokenEntity[];
  @Input() isInitializing: boolean;
  displayedColumns: string[] = ['name', 'expiry', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountTokenEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _selectedProject: ProjectEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService,
    private readonly _userService: UserService,
    private readonly _googleAnalyticsService: GoogleAnalyticsService,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject
      .pipe(
        switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        })
      )
      .pipe(first())
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.userGroupConfig(userGroup)));
  }

  getDataSource(): MatTableDataSource<ServiceAccountTokenEntity> {
    this.dataSource.data = this.serviceaccountTokens ? this.serviceaccountTokens : [];
    return this.dataSource;
  }

  isEnabled(action: string): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.serviceaccountToken[action];
  }

  addServiceAccountToken(): void {
    const modal = this._matDialog.open(AddServiceAccountTokenComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = this.serviceaccount;
  }

  regenerateServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Regenerate Token',
        message: `Regenerate token "<strong>${token.name}</strong>" for service account "<strong>${this.serviceaccount.name}</strong>"?`,
        confirmLabel: 'Regenerate',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'regenerateServiceAccountTokenOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ =>
          this._apiService.regenerateServiceAccountToken(this._selectedProject.id, this.serviceaccount, token)
        )
      )
      .pipe(first())
      .subscribe(token => {
        this.openTokenDialog(token);
        this._notificationService.success(`The <strong>${token.name}</strong> was regenerated`);
        this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenRegenerated');
      });
  }

  editServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(EditServiceAccountTokenComponent);
    modal.componentInstance.project = this._selectedProject;
    modal.componentInstance.serviceaccount = this.serviceaccount;
    modal.componentInstance.token = token;
  }

  deleteServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Token',
        message: `Delete token "<strong>${token.name}</strong>" from service account "<strong>${this.serviceaccount.name}</strong>" permanently?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'deleteServiceAccountTokenOpened');

    dialogRef
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(
        switchMap(_ => this._apiService.deleteServiceAccountToken(this._selectedProject.id, this.serviceaccount, token))
      )
      .pipe(first())
      .subscribe(() => {
        this._notificationService.success(
          `The <strong>${token.name}</strong> token was removed from the <strong>${this.serviceaccount.name}</strong> service account`
        );
        this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenDeleted');
      });
  }

  openTokenDialog(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
  }
}
