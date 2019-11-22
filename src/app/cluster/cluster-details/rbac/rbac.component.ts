import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig, MatTableDataSource} from '@angular/material';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {RBACService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ConfirmationDialogComponent} from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {Binding, ClusterBinding, SimpleBinding, SimpleClusterBinding} from '../../../shared/entity/RBACEntity';

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

  isShowRBAC = false;
  dataSourceCluster = new MatTableDataSource<SimpleClusterBinding>();
  displayedColumnsCluster: string[] = ['name', 'clusterRole', 'actions'];
  clusterBindings: SimpleClusterBinding[];
  dataSourceNamespace = new MatTableDataSource<SimpleBinding>();
  displayedColumnsNamespace: string[] = ['name', 'clusterRole', 'namespace', 'actions'];
  bindings: SimpleBinding[];
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _rbacService: RBACService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this.dataSourceCluster.data = this.clusterBindings;
    this.dataSourceNamespace.data = this.bindings;

    this._rbacService.getClusterBindings(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((bindings: ClusterBinding[]) => {
          this.clusterBindings = this.createSimpleClusterBinding(bindings);
        });

    this._rbacService.getBindings(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((bindings: Binding[]) => {
          this.bindings = this.createSimpleBinding(bindings);
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  addBinding(): void {
    const modal = this._matDialog.open(AddBindingComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.datacenter = this.datacenter;
    modal.componentInstance.projectID = this.projectID;
    modal.afterClosed().pipe(first()).subscribe(() => {});
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

  createSimpleClusterBinding(bindings: ClusterBinding[]): SimpleClusterBinding[] {
    const clusterBindingArray = [];
    for (const i in bindings) {
      if (bindings.hasOwnProperty(i)) {
        for (const j in bindings[i].subjects) {
          if (bindings[i].subjects.hasOwnProperty(i)) {
            clusterBindingArray.push({name: bindings[i].subjects[j].name, role: bindings[i].roleRefName});
          }
        }
      }
    }
    return clusterBindingArray;
  }

  createSimpleBinding(bindings: Binding[]): SimpleBinding[] {
    const bindingArray = [];
    for (const i in bindings) {
      if (bindings.hasOwnProperty(i)) {
        for (const j in bindings[i].subjects) {
          if (bindings[i].subjects.hasOwnProperty(i)) {
            bindingArray.push(
                {name: bindings[i].subjects[j].name, role: bindings[i].roleRefName, namespace: bindings[i].namespace});
          }
        }
      }
    }
    return bindingArray;
  }

  deleteClusterBinding(element: SimpleClusterBinding): void {
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

  deleteBinding(element: SimpleBinding): void {
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
