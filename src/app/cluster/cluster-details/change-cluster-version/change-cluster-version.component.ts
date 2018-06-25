import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-change-cluster-version',
  templateUrl: './change-cluster-version.component.html',
  styleUrls: ['./change-cluster-version.component.scss']
})
export class ChangeClusterVersionComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  possibleVersions: string[];
  selectedVersion: string;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<ChangeClusterVersionComponent>) {
  }

  public ngOnInit() {
    if (this.possibleVersions.length > 0) {
      this.selectedVersion = this.possibleVersions[this.possibleVersions.length - 1];
    }
  }

  changeVersion(): void {
    this.cluster.spec.version = this.selectedVersion;

    this.api.editCluster(this.cluster, this.datacenter.metadata.name).subscribe(result => {
      this.dialogRef.close();
      NotificationActions.success('Success', `Cluster Version is being changed`);
      this.selectedVersion = null;
    });

  }
}
