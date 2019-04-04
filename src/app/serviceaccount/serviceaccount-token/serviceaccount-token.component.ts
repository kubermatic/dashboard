import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {first} from 'rxjs/operators';

import {ApiService, ProjectService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ServiceAccountEntity} from '../../shared/entity/ServiceAccountEntity';

@Component({
  selector: 'kubermatic-serviceaccount-token',
  templateUrl: './serviceaccount-token.component.html',
  styleUrls: ['./serviceaccount-token.component.scss'],
})

export class ServiceAccountTokenComponent implements OnInit {
  @Input() serviceaccount: ServiceAccountEntity;
  isInitializing = true;
  serviceaccountToken: ServiceAccountEntity[] = [];
  displayedColumns: string[] = ['name', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort) sort: MatSort;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _googleAnalyticsService: GoogleAnalyticsService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this.serviceaccountToken.push(this.serviceaccount);
  }

  getDataSource(): MatTableDataSource<ServiceAccountEntity> {
    this.dataSource.data = this.serviceaccountToken;
    return this.dataSource;
  }

  isEnabled(action: string): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].serviceaccountToken[action];
  }

  regenerateServiceAccountToken(token: ServiceAccountEntity): void {
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
        this._apiService.createServiceAccountToken(this._projectService.project.id, this.serviceaccount)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  'Success', `Token has been added to Service Account ${this.serviceaccount.name}`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenRegenerated');
            });
      }
    });
  }

  deleteServiceAccountToken(token: ServiceAccountEntity): void {
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
        this._apiService.deleteServiceAccountToken(this._projectService.project.id, this.serviceaccount, token)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(
                  'Success', `Token ${token.name} has been removed from Service Account ${this.serviceaccount.name}`);
              this._googleAnalyticsService.emitEvent('serviceAccountTokenOverview', 'ServiceAccountTokenDeleted');
            });
      }
    });
  }
}
