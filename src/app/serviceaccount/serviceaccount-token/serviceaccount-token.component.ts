import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {first} from 'rxjs/operators';

import {ApiService, ProjectService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ServiceAccountEntity, ServiceAccountTokenEntity} from '../../shared/entity/ServiceAccountEntity';
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

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';
  }

  getDataSource(): MatTableDataSource<ServiceAccountTokenEntity> {
    this.dataSource.data = !!this.serviceaccountTokens ? this.serviceaccountTokens : [];
    return this.dataSource;
  }

  isEnabled(action: string): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].serviceaccountToken[action];
  }

  addServiceAccountToken(): void {
    const modal = this._matDialog.open(AddServiceAccountTokenComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.serviceaccount = this.serviceaccount;
  }

  regenerateServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Regenerate Token for Service Account',
        message: `You are on the way to regenerate Token ${token.name} for the Service Account ${
            this.serviceaccount.name}. This cannot be undone!`,
        confirmLabel: 'Regenerate',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'regenerateServiceAccountTokenOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService
            .regenerateServiceAccountToken(this._projectService.getCurrentProjectId(), this.serviceaccount, token)
            .pipe(first())
            .subscribe((token) => {
              this.openTokenDialog(token);
              NotificationActions.success('Success', `Token ${token.name} has been regenerated.`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenRegenerated');
            });
      }
    });
  }

  editServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const modal = this._matDialog.open(EditServiceAccountTokenComponent);
    modal.componentInstance.project = this._projectService.project;
    modal.componentInstance.serviceaccount = this.serviceaccount;
    modal.componentInstance.token = token;
  }

  deleteServiceAccountToken(token: ServiceAccountTokenEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Remove Token from Service Account',
        message: `You are on the way to remove the Token ${token.name} from the Service Account ${
            this.serviceaccount.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);
    this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'deleteServiceAccountTokenOpened');

    dialogRef.afterClosed().pipe(first()).subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this._apiService
            .deleteServiceAccountToken(this._projectService.getCurrentProjectId(), this.serviceaccount, token)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  'Success', `Token ${token.name} has been removed from Service Account ${this.serviceaccount.name}`);
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
