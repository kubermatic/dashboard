import {Component, OnChanges, OnInit, ViewChild} from '@angular/core';
import {filter, take, takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {NotificationService, UserService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {Subject} from 'rxjs';
import {AdminEntity} from '../../../shared/entity/AdminSettings';
import {AddAdminDialogComponent} from './add-admin-dialog/add-admin-dialog.component';
import {MemberEntity} from '../../../shared/entity/MemberEntity';

@Component({
  selector: 'km-admins',
  templateUrl: './admins.component.html',
  styleUrls: ['./admins.component.scss'],
})
export class AdminsComponent implements OnInit, OnChanges {
  user: MemberEntity;
  admins: AdminEntity[] = [];
  dataSource = new MatTableDataSource<AdminEntity>();
  displayedColumns: string[] = ['name', 'email', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
    private readonly _settingsService: SettingsService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _matDialog: MatDialog
  ) {}

  ngOnInit() {
    this.dataSource.data = this.admins;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._settingsService.admins.pipe(takeUntil(this._unsubscribe)).subscribe(admins => {
      this.admins = admins.sort((a, b) => a.email.localeCompare(b.email));
      this.dataSource.data = this.admins;
    });

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });

    this._userService.loggedInUser.pipe(take(1)).subscribe(user => (this.user = user));
  }

  ngOnChanges(): void {
    this.dataSource.data = this.admins;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isDeleteEnabled(admin: AdminEntity): boolean {
    return !!this.user && admin.email !== this.user.email;
  }

  delete(admin: AdminEntity): void {
    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Admin',
        message: `Are you sure you want to take admin rights from ${admin.name}?`,
        confirmLabel: 'Delete',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(take(1))
      .subscribe(_ => {
        admin.isAdmin = false;
        this._updateAdmin(admin);
      });
  }

  private _updateAdmin(admin: AdminEntity): void {
    this._settingsService
      .setAdmin(admin)
      .pipe(take(1))
      .subscribe(() => {
        this._notificationService.success(`The <strong>${admin.name}</strong> user was deleted from admin group`);
        this._settingsService.refreshAdmins();
      });
  }

  add(): void {
    this._matDialog
      .open(AddAdminDialogComponent)
      .afterClosed()
      .pipe(take(1))
      .subscribe(admin => {
        if (admin) {
          this._settingsService.refreshAdmins();
        }
      });
  }

  isPaginatorVisible(): boolean {
    return this.admins && this.admins.length > 0 && this.paginator && this.admins.length > this.paginator.pageSize;
  }
}
