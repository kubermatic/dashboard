import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {RBACService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {ClusterRole, Role} from '../../../shared/entity/RBACEntity';
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

  clusterRoles: ClusterRole[];
  roles: Role[];
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _rbacService: RBACService, private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this._rbacService.getClusterRoles(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((roles: ClusterRole[]) => {
          this.clusterRoles = roles;
        });

    this._rbacService.getRoles(this.cluster.id, this.datacenter.metadata.name, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((roles: Role[]) => {
          this.roles = roles;
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
}
