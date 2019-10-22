import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialog, MatDialogRef} from '@angular/material';
import * as _ from 'lodash';

import {ClusterService, UserService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {RevokeViewerTokenComponent} from '../revoke-viewer-token/revoke-viewer-token.component';

@Component({
  selector: 'kubermatic-edit-cluster',
  templateUrl: './edit-cluster.component.html',
})
export class EditClusterComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  form: FormGroup;
  labels: object;
  private _currentUserGroup: string;

  constructor(
      private readonly _clusterService: ClusterService, private readonly _userService: UserService,
      private readonly _matDialog: MatDialog, private readonly _matDialogRef: MatDialogRef<EditClusterComponent>) {}

  ngOnInit(): void {
    this.labels = _.cloneDeep(this.cluster.labels);

    this.form = new FormGroup({
      name: new FormControl(
          this.cluster.name,
          [
            Validators.required,
            Validators.minLength(3),
            Validators.pattern('[a-zA-Z0-9-]*'),
          ]),
      auditLogging: new FormControl(!!this.cluster.spec.auditLogging && this.cluster.spec.auditLogging.enabled),
    });

    this._userService.currentUserGroup(this.projectID).subscribe(userGroup => this._currentUserGroup = userGroup);
  }

  editCluster(): void {
    const patch: ClusterEntityPatch = {
      name: this.form.controls.name.value,
      labels: this.labels,
      spec: {
        auditLogging: {
          enabled: this.form.controls.auditLogging.value,
        }
      },
    };

    this._clusterService.patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, patch)
        .subscribe((cluster) => {
          this._matDialogRef.close(cluster);
          this._clusterService.onClusterUpdate.next();
          NotificationActions.success(`Cluster ${this.cluster.name} has been successfully edited`);
        });
  }

  isRevokeViewerTokenEnabled(): boolean {
    return !this._currentUserGroup || this._currentUserGroup === 'owners' || this._currentUserGroup === 'editors';
  }

  revokeViewerToken(): void {
    const dialogRef = this._matDialog.open(RevokeViewerTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.datacenter = this.datacenter;
    dialogRef.componentInstance.projectID = this.projectID;
  }
}
