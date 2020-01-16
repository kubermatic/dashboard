import {Component, Input, OnChanges, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatDialogConfig, MatPaginator, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {RBACService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {SimpleBinding, SimpleClusterBinding} from '../../../shared/entity/RBACEntity';

import {AddBindingComponent} from './add-binding/add-binding.component';

@Component({
  selector: 'kubermatic-rbac',
  templateUrl: './rbac.component.html',
  styleUrls: ['./rbac.component.scss'],
})

export class RBACComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  @Input() isClusterRunning: boolean;
  @Input() clusterBindings: SimpleClusterBinding[] = [];
  @Input() bindings: SimpleBinding[] = [];

  isShowRBAC = false;
  dataSourceCluster = new MatTableDataSource<SimpleClusterBinding>();
  displayedColumnsCluster: string[] = ['name', 'clusterRole', 'actions'];
  dataSourceNamespace = new MatTableDataSource<SimpleBinding>();
  displayedColumnsNamespace: string[] = ['name', 'clusterRole', 'namespace', 'actions'];
  @ViewChild('matPaginatorCluster', {static: false}) paginatorCluster: MatPaginator;
  @ViewChild('matPaginatorNamespace', {static: false}) paginatorNamespace: MatPaginator;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _rbacService: RBACService, private readonly _matDialog: MatDialog,
      private readonly _settingsService: SettingsService) {}

  ngOnInit(): void {
    this.dataSourceCluster.data = this.clusterBindings;
    this.dataSourceCluster.paginator = this.paginatorCluster;

    this.dataSourceNamespace.data = this.bindings;
    this.dataSourceNamespace.paginator = this.paginatorNamespace;

    this._settingsService.userSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginatorCluster.pageSize = settings.itemsPerPage;
      this.dataSourceCluster.paginator = this.paginatorCluster;  // Force refresh.

      this.paginatorNamespace.pageSize = settings.itemsPerPage;
      this.dataSourceNamespace.paginator = this.paginatorNamespace;  // Force refresh.
    });
  }

  ngOnChanges(): void {
    this.dataSourceCluster.data = this.clusterBindings;
    this.dataSourceNamespace.data = this.bindings;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addBinding(event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(AddBindingComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
  }

  toggleRBAC(): void {
    this.isShowRBAC = !this.isShowRBAC;
  }

  deleteClusterBinding(element: SimpleClusterBinding, event: Event): void {
    event.stopPropagation();

    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Binding',
        message: `Are you sure you want to permanently delete "<strong>${element.name}</strong>"
          from binding?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (isConfirmed) {
        this._rbacService
            .deleteClusterBinding(
                this.cluster.id, this.datacenter.metadata.name, this.projectID, element.role, element.name)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(`${element.name} has been removed from binding`);
            });
      }
    });
  }

  deleteBinding(element: SimpleBinding, event: Event): void {
    event.stopPropagation();

    const dialogConfig: MatDialogConfig = {
      disableClose: false,
      hasBackdrop: true,
      data: {
        title: 'Delete Binding',
        message: `Are you sure you want to permanently delete "<strong>${element.name}</strong>"
          from binding?`,
        confirmLabel: 'Delete',
      },
    };

    const dialogRef = this._matDialog.open(ConfirmationDialogComponent, dialogConfig);

    dialogRef.afterClosed().pipe(first()).subscribe(isConfirmed => {
      if (isConfirmed) {
        this._rbacService
            .deleteBinding(
                this.cluster.id, this.datacenter.metadata.name, this.projectID, element.role, element.namespace,
                element.name)
            .pipe(first())
            .subscribe(() => {
              NotificationActions.success(`${element.name} has been removed from binding`);
            });
      }
    });
  }

  hasClusterItems(): boolean {
    return this.clusterBindings && this.clusterBindings.length > 0;
  }

  isClusterPaginatorVisible(): boolean {
    return this.hasClusterItems() && this.paginatorCluster &&
        this.clusterBindings.length < this.paginatorCluster.pageSize;
  }

  hasNamespaceItems(): boolean {
    return this.bindings && this.bindings.length > 0;
  }

  isNamespacePaginatorVisible(): boolean {
    return this.hasNamespaceItems() && this.paginatorCluster && this.bindings.length < this.paginatorCluster.pageSize;
  }
}
