import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs';
import {first} from 'rxjs/operators';

import {RBACService} from '../../../core/services';
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

export class RBACComponent implements OnInit, OnDestroy {
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
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _rbacService: RBACService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
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

  getDataSourceCluster(): MatTableDataSource<SimpleClusterBinding> {
    this.dataSourceCluster.data = this.clusterBindings;
    return this.dataSourceCluster;
  }

  getDataSourceNamespace(): MatTableDataSource<SimpleBinding> {
    this.dataSourceNamespace.data = this.bindings;
    return this.dataSourceNamespace;
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
}
