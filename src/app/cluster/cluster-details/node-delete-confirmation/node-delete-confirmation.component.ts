import { Component, Input, OnInit } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { ApiService } from '../../../core/services';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './node-delete-confirmation.component.html',
  styleUrls: ['./node-delete-confirmation.component.scss']
})

export class NodeDeleteConfirmationComponent implements OnInit {
  @Input() node: NodeEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  public title: string;
  public message: string;
  public titleAlign?: string;
  public messageAlign?: string;
  public btnOkText?: string;
  public btnCancelText?: string;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<NodeDeleteConfirmationComponent>,
              public googleAnalyticsService: GoogleAnalyticsService) {
  }

  ngOnInit(): void {
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');
  }

  public deleteNode(): void {
    this.api.deleteClusterNode(this.cluster.id, this.node, this.datacenter.metadata.name, this.projectID).subscribe(result => {
      NotificationActions.success('Success', `Node removed successfully`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
    });
    this.dialogRef.close(true);
  }
}
