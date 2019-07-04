import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {first, switchMap} from 'rxjs/operators';

import {ApiService, ProjectService, UserService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {ServiceAccountEntity, ServiceAccountTokenEntity} from '../../shared/entity/ServiceAccountEntity';
import {GroupConfig} from '../../shared/model/Config';
import {ButtonUtils} from '../../shared/utils/button-utils/button-utils';
import {AddServiceAccountTokenComponent} from './add-serviceaccount-token/add-serviceaccount-token.component';
import {EditServiceAccountTokenComponent} from './edit-serviceaccount-token/edit-serviceaccount-token.component';
import {TokenDialogComponent} from './token-dialog/token-dialog.component';

@Component({
  selector: 'kubermatic-serviceaccount-token',
  templateUrl: './serviceaccount-token.component.html',
  styleUrls: ['./serviceaccount-token.component.scss'],
})

export class ServiceAccountTokenComponent implements OnInit {
  @Input() serviceaccount: ServiceAccountEntity;
  @Input() serviceaccountTokens: ServiceAccountTokenEntity[];
  @Input() isInitializing: boolean;
  displayedColumns: string[] = ['name', 'expiry', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountTokenEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _selectedProject: ProjectEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _googleAnalyticsService: GoogleAnalyticsService,
      private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        }))
        .pipe(first())
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));
  }

  getDataSource(): MatTableDataSource<ServiceAccountTokenEntity> {
    this.dataSource.data = !!this.serviceaccountTokens ? this.serviceaccountTokens : [];
    return this.dataSource;
  }

  getButtonWrapperClass(isDisabled: boolean): string {
    return ButtonUtils.getButtonWrapperClass(isDisabled);
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
        message: `Are you sure you want to regenerate token "<strong>${token.name}</strong>"
          for service account "<strong>${this.serviceaccount.name}</strong>"?`,
        confirmLabel: 'Regenerate',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'regenerateServiceAccountTokenOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.regenerateServiceAccountToken(this._selectedProject.id, this.serviceaccount, token)
            .pipe(first())
            .subscribe((token) => {
              this.openTokenDialog(token);
              NotificationActions.success(`Token ${token.name} has been regenerated.`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenRegenerated');
            });
      }
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
        message: `Are you sure you want to permanently delete token "<strong>${token.name}</strong>"
          from service account "<strong>${this.serviceaccount.name}</strong>"?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'deleteServiceAccountTokenOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService.deleteServiceAccountToken(this._selectedProject.id, this.serviceaccount, token)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  `Token ${token.name} has been removed from Service Account ${this.serviceaccount.name}`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenDeleted');
            });
      }
    });
  }

  openTokenDialog(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(TokenDialogComponent);
    modal.componentInstance.serviceaccountToken = token;
  }
}
