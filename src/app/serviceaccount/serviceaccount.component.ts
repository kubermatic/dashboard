import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatSort, MatTableDataSource} from '@angular/material';
import {interval, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {NotificationActions} from '../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../shared/components/confirmation-dialog/confirmation-dialog.component';
import {MemberEntity} from '../shared/entity/MemberEntity';
import {ProjectEntity} from '../shared/entity/ProjectEntity';
import {ServiceAccountEntity} from '../shared/entity/ServiceAccountEntity';
import {UserGroupConfig} from '../shared/model/Config';
import {AddServiceAccountComponent} from './add-serviceaccount/add-serviceaccount.component';
import {EditServiceAccountComponent} from './edit-serviceaccount/edit-serviceaccount.component';

@Component({
  selector: 'kubermatic-serviceaccount',
  templateUrl: './serviceaccount.component.html',
  styleUrls: ['./serviceaccount.component.scss'],
})

export class ServiceAccountComponent implements OnInit, OnDestroy {
  project: ProjectEntity;
  serviceAccounts: ServiceAccountEntity[] = [];
  loading = true;
  currentUser: MemberEntity;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  displayedColumns: string[] = ['status', 'name', 'group', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private projectService: ProjectService, public dialog: MatDialog,
      private userService: UserService, private appConfigService: AppConfigService,
      private googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.project = this.projectService.project;

    this.userService.getUser().pipe(first()).subscribe((user) => {
      this.currentUser = user;
    });

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe((project) => {
      this.project = project;
      this.userGroupConfig = this.appConfigService.getUserGroupConfig();
      this.userService.currentUserGroup(this.project.id).subscribe((group) => {
        this.userGroup = group;
      });
    }));

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe(() => {
      this.refreshServiceAccounts();
    }));
    this.refreshServiceAccounts();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getDataSource(): MatTableDataSource<ServiceAccountEntity> {
    this.dataSource.data = this.serviceAccounts;
    return this.dataSource;
  }

  refreshServiceAccounts(): void {
    if (this.project) {
      this.subscriptions.push(this.api.getServiceAccounts(this.project.id).subscribe((res) => {
        this.serviceAccounts = res;
        this.loading = false;
      }));
    }
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

  addServiceAccount(): void {
    const modal = this.dialog.open(AddServiceAccountComponent);
    modal.componentInstance.project = this.project;

    const sub = modal.afterClosed().subscribe((added) => {
      if (added) {
        this.refreshServiceAccounts();
      }
      sub.unsubscribe();
    });
  }

  editServiceAccount(serviceAccount: ServiceAccountEntity): void {
    const modal = this.dialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.serviceaccount = serviceAccount;
    const sub = modal.afterClosed().subscribe((edited) => {
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
            this.project.name}. This cannot be undone!`,
        confirmLabel: 'Delete',
        cancelLabel: 'Close',
      },
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, dialogConfig);
    this.googleAnalyticsService.emitEvent('serviceAccountOverview', 'deleteServiceAccountOpened');

    dialogRef.afterClosed().subscribe((isConfirmed: boolean) => {
      if (isConfirmed) {
        this.api.deleteServiceAccounts(this.project.id, serviceAccount).subscribe(() => {
          NotificationActions.success(
              'Success', `Service Account ${serviceAccount.name} has been removed from project ${this.project.name}`);
          this.googleAnalyticsService.emitEvent('serviceAccountOverview', 'ServiceAccountDeleted');
        });
      }
    });
  }
}
