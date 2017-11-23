
import { Component, OnInit, Input, DoCheck } from '@angular/core';
import { RouterModule, Router } from "@angular/router";
import { ApiService } from "../../api/api.service";
import { MdDialogRef } from '@angular/material';
import { CreateNodesService } from '../../core/services';
import {DataCenterEntity} from "../../shared/entity/DatacenterEntity";
import { NotificationActions } from 'app/actions/notification.actions';

@Component({
  selector: 'kubermatic-cluster-delete-confirmation',
  templateUrl: './cluster-delete-confirmation.component.html',
  styleUrls: ['./cluster-delete-confirmation.component.scss']
})
export class ClusterDeleteConfirmationComponent implements OnInit, DoCheck {

  @Input() humanReadableName: string;
  @Input() clusterName: string;

  public disableDeleteCluster: boolean = false;
  public cluster: any;

  constructor(
    private router: Router,
    private api: ApiService,
    private dialogRef: MdDialogRef<ClusterDeleteConfirmationComponent>,
    private createNodesService: CreateNodesService,
    private notificationActions: NotificationActions
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
        this.api.deleteCluster(this.clusterName).subscribe(result => {
          this.cluster = result;
          this.createNodesService.preventCreatingInitialClusterNodes();
          this.notificationActions.success("Success", `Cluster is beeing deleted`);

          this.router.navigate(['/clusters']);
        });
    }
  }
}
