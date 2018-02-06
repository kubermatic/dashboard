import { Component, Inject} from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {UpgradeClusterComponentData} from 'app/shared/model/UpgradeClusterDialogData';


@Component({
  selector: 'kubermatic-upgrade-cluster',
  templateUrl: './upgrade-cluster.component.html',
  styleUrls: ['./upgrade-cluster.component.scss']
})
export class UpgradeClusterComponent {
  selectedVersion: string = this.data.upgradesList[this.data.upgradesList.length - 1];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpgradeClusterComponentData,
    private api: ApiService,
    private dialogRef: MatDialogRef<UpgradeClusterComponent>
  ) { }

  upgrade(): void {
      this.api.updateClusterUpgrade(this.data.clusterName, this.selectedVersion);
      this.selectedVersion = null;
      this.dialogRef.close();
  }
}
