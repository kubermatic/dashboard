import { Component, Input, OnInit } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { ApiService } from '../../../core/services';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

@Component({
  selector: 'kubermatic-node-duplicate',
  templateUrl: './node-duplicate.component.html',
  styleUrls: ['./node-duplicate.component.scss']
})

export class NodeDuplicateComponent implements OnInit {
  @Input() node: NodeEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<NodeDuplicateComponent>,
              public googleAnalyticsService: GoogleAnalyticsService) {
  }

  ngOnInit() {
    this.googleAnalyticsService.emitEvent('clusterOverview', 'duplicateNodeDialogOpened');
  }

  public duplicateNode(): void {
    const nodeSpec: NodeEntity = {
      spec: {
        cloud: this.node.spec.cloud,
        operatingSystem: this.node.spec.operatingSystem,
        versions: {
          containerRuntime: {
            name: this.node.spec.versions.containerRuntime.name,
          },
        },
      },
      status: {}
    };

    this.api.createClusterNode(this.cluster, nodeSpec, this.datacenter.metadata.name, this.projectID).subscribe(result => {
      NotificationActions.success('Success', `Duplicate node successfully`);
      this.googleAnalyticsService.emitEvent('clusterOverview', 'nodeDuplicated');
    });
    this.dialogRef.close(true);
  }

}
