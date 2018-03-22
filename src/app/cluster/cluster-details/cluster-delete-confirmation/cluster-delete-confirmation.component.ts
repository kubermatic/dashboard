import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from 'app/core/services/api/api.service';
import { MatDialogRef } from '@angular/material';
import { CreateNodesService } from 'app/core/services';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { NotificationActions } from 'app/redux/actions/notification.actions';


@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {

  @Input() humanReadableName: string;
  @Input() clusterName: string;
  @Input() datacenter: DataCenterEntity;

  public disableDeleteCluster: boolean = false;
  public cluster: any;

  constructor(
    private router: Router,
    private api: ApiService,
    private dialogRef: MatDialogRef<ClusterDeleteConfirmationComponent>,
    private createNodesService: CreateNodesService
  ) {}

  ngOnInit() {}

  ngDoCheck(): void {
    document.getElementById('name').focus();
  }

  onChange(event: any) {
    if (event.target.value === this.humanReadableName && event.target.value.length ) {
      this.disableDeleteCluster = true;
    } else {
      this.disableDeleteCluster = false;
    }
  }

  deleteCluster() {
    if (this.disableDeleteCluster === true) {
        this.dialogRef.close();
        this.api.deleteCluster(this.clusterName, this.datacenter.spec.seed).subscribe(result => {
          this.cluster = result;
          this.createNodesService.preventCreatingInitialClusterNodes();
          NotificationActions.success('Success', `Cluster is beeing deleted`);

          this.router.navigate(['/clusters']);
        });
    }
  }
}
