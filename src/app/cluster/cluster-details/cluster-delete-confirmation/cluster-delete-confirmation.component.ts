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
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  public disableDeleteCluster: boolean = false;

  constructor(private router: Router,
              private api: ApiService,
              private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
              private createNodesService: CreateNodesService) {
  }

  ngOnInit() {
  }

  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any) {
    if (event.target.value === this.cluster.spec.humanReadableName && event.target.value.length) {
      this.disableDeleteCluster = true;
    } else {
      this.disableDeleteCluster = false;
    }
  }

  deleteCluster() {
    if (this.disableDeleteCluster === true) {
      this.api.deleteCluster(this.cluster.metadata.name, this.datacenter.metadata.name).subscribe(result => {
        this.createNodesService.preventCreatingInitialClusterNodes();
        NotificationActions.success('Success', `Cluster is beeing deleted`);
        this.router.navigate(['/clusters']);
      });
      this.dialogRef.close();
    }
  }
}
