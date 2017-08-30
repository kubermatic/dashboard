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
    @Inject(MD_DIALOG_DATA) public data: any, 
    private api: ApiService,
    private dialogRef: MdDialogRef<UpgradeClusterComponent>
  ) { }

  upgrade(): void {
      this.api.updateClusterUpgrade(this.data.clusterModel, this.selectedVersion);
      this.selectedVersion = null;
      this.dialogRef.close();
  }
}
