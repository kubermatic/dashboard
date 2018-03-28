import { Component, DoCheck, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { ApiService, CreateNodesService } from '../../../core/services';
import { NotificationActions } from '../../../redux/actions/notification.actions';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements DoCheck {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  public disableDeleteCluster = false;
  public inputName = '';

  constructor(private router: Router,
              private api: ApiService,
              private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
              private createNodesService: CreateNodesService) {
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
    this.api.deleteCluster(this.cluster.metadata.name, this.datacenter.metadata.name).subscribe(result => {
      this.createNodesService.preventCreatingInitialClusterNodes();
      NotificationActions.success('Success', `Cluster is being deleted`);
    });
    this.dialogRef.close(true);
  }
}
