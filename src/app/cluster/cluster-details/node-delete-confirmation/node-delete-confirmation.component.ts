import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './node-delete-confirmation.component.html',
  styleUrls: ['./node-delete-confirmation.component.scss'],
})

export class NodeDeleteConfirmationComponent implements OnInit {
  @Input() node: NodeEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  title: string;
  message: string;
  titleAlign?: string;
  messageAlign?: string;
  btnOkText?: string;
  btnCancelText?: string;

  constructor(
      private api: ApiService, private dialogRef: MatDialogRef<NodeDeleteConfirmationComponent>,
      public googleAnalyticsService: GoogleAnalyticsService) {}

  ngOnInit(): void {
    this.googleAnalyticsService.emitEvent('clusterOverview', 'deleteNodeDialogOpened');
  }

  deleteNode(): void {
    this.api.deleteClusterNode(this.cluster.id, this.node, this.datacenter.metadata.name, this.projectID)
        .subscribe((result) => {
          NotificationActions.success('Success', `Node removed successfully`);
          this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDeleted');
        });
    this.dialogRef.close(true);
  }
}
