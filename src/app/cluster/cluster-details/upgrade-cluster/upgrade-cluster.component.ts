import { Component, Input, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ApiService } from '../../../core/services';

@Component({
  selector: 'kubermatic-upgrade-cluster',
  templateUrl: './upgrade-cluster.component.html',
  styleUrls: ['./upgrade-cluster.component.scss']
})
export class UpgradeClusterComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  possibleVersions: string[];
  selectedVersion: string;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<UpgradeClusterComponent>) {
  }

  public ngOnInit() {
    if (this.possibleVersions.length > 0) {
      this.selectedVersion = this.possibleVersions[this.possibleVersions.length - 1];
    }
  }

  upgrade(): void {
    this.api.updateClusterUpgrade(this.cluster.metadata.name, this.selectedVersion)
      .subscribe(result => NotificationActions.success('Success', `Cluster is being upgraded`));

    this.selectedVersion = null;
    this.dialogRef.close();
  }
}
