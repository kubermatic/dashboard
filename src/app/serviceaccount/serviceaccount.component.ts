import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {interval, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';
import {AppConfigService} from '../app-config.service';
import {ApiService, ProjectService, UserService} from '../core/services';
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
  displayedColumns: string[] = ['name', 'group', 'status', 'creationDate', 'actions'];
  dataSource = new MatTableDataSource<ServiceAccountEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private projectService: ProjectService, public dialog: MatDialog,
      private userService: UserService, private appConfigService: AppConfigService) {}

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

  refreshServiceAccounts(): void {
    if (this.project) {
      this.subscriptions.push(this.api.getServiceAccounts(this.project.id).subscribe((res) => {
        this.serviceAccounts = res;
        this.loading = false;
      }));
    }
  }

  editServiceAccount(serviceAccount: ServiceAccountEntity): void {
    const modal = this.dialog.open(EditServiceAccountComponent);
    modal.componentInstance.project = this.project;
    modal.componentInstance.serviceaccount = serviceAccount;
    const sub = modal.afterClosed().subscribe((edited) => {
      sub.unsubscribe();
    });
  }
}
