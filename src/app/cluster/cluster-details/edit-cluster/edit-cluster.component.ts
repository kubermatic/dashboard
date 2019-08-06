import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';

import {ClusterService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {ClusterEntityPatch} from '../../../shared/entity/ClusterEntityPatch';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-edit-cluster',
  templateUrl: './edit-cluster.component.html',
})
export class EditClusterComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  editClusterForm: FormGroup;

  constructor(
      private readonly _cluster: ClusterService, private readonly _dialogRef: MatDialogRef<EditClusterComponent>) {}

  ngOnInit(): void {
    this.editClusterForm = new FormGroup({
      name: new FormControl(
          this.cluster.name, [Validators.required, Validators.minLength(3), Validators.pattern('[a-zA-Z0-9-]*')]),
    });
  }

  editCluster(): void {
    const clusterEntityPatch: ClusterEntityPatch = {
      spec: {
        humanReadableName: this.editClusterForm.controls.name.value,
      },
    };

    this._cluster.patch(this.projectID, this.cluster.id, this.datacenter.metadata.name, clusterEntityPatch)
        .subscribe((cluster) => {
          this._dialogRef.close(cluster);
          NotificationActions.success(`Cluster ${this.cluster.name} has been edited successfully`);
        });
  }
}
