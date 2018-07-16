import { Component, DoCheck, Input } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ApiService, InitialNodeDataService } from '../../../core/services';
import { NotificationActions } from '../../../redux/actions/notification.actions';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements DoCheck {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  public inputName = '';

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
              private initialNodeDataService: InitialNodeDataService) {
  }

  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any) {
    this.inputName = event.target.value;
  }

  inputNameMatches(): boolean {
    return this.inputName === this.cluster.spec.humanReadableName;
  }

  deleteCluster() {
    if (!this.inputNameMatches()) {
      return;
    } else {
      this.api.deleteCluster(this.cluster.metadata.name, this.datacenter.metadata.name).subscribe(result => {
        this.initialNodeDataService.clearInitialNodeData(this.cluster);
        NotificationActions.success('Success', `Cluster is being deleted`);
      });
      this.dialogRef.close(true);
    }
  }
}
