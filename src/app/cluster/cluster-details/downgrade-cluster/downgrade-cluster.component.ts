import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-downgrade-cluster',
  templateUrl: './downgrade-cluster.component.html',
  styleUrls: ['./downgrade-cluster.component.scss']
})
export class DowngradeClusterComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  possibleVersions: string[];
  selectedVersion: string;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<DowngradeClusterComponent>) {
  }

  public ngOnInit() {
    if (this.possibleVersions.length > 0) {
      this.selectedVersion = this.possibleVersions[this.possibleVersions.length - 1];
    }
  }

  downgrade(): void {
    this.cluster.spec.version = this.selectedVersion;

    this.api.editCluster(this.cluster, this.datacenter.metadata.name).subscribe(result => {
      NotificationActions.success('Success', `Cluster is being downgraded`);
    });

    this.selectedVersion = null;
    this.dialogRef.close();
  }
}
