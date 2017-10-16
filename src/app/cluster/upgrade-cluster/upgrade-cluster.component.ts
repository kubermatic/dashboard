import { Component, Inject} from '@angular/core';
import { ApiService } from '../../api/api.service';
import { MdDialogRef, MD_DIALOG_DATA } from '@angular/material';


@Component({
  selector: 'kubermatic-upgrade-cluster',
  templateUrl: './upgrade-cluster.component.html',
  styleUrls: ['./upgrade-cluster.component.scss']
})
export class UpgradeClusterComponent{
  selectedVersion: string = null;

  constructor(
    @Inject(MD_DIALOG_DATA) public data: UpgradeClusterComponentData,
    private api: ApiService,
    private dialogRef: MdDialogRef<UpgradeClusterComponent>
  ) { }

  upgrade(): void {
      this.api.updateClusterUpgrade(this.data.clusterName, this.selectedVersion);
      this.selectedVersion = null;
      this.dialogRef.close();
  }
}

export class UpgradeClusterComponentData {
  clusterName: string;
  upgradesList: string[];

  constructor(clusterName: string, upgradesList: string[]) {
    this.clusterName = clusterName;
    this.upgradesList = upgradesList;
  }

}
