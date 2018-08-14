import { Component, Input, OnInit } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { ApiService } from '../../../core/services';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-node-duplicate',
  templateUrl: './node-duplicate.component.html',
  styleUrls: ['./node-duplicate.component.scss']
})

export class NodeDuplicateComponent implements OnInit {
  @Input() node: NodeEntity;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() project: ProjectEntity;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<NodeDuplicateComponent>) {
  }

  ngOnInit() {
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

    this.api.createClusterNode(this.cluster, nodeSpec, this.datacenter.metadata.name, this.project.id).subscribe(result => {
      NotificationActions.success('Success', `Duplicate node successfully`);
    });
    this.dialogRef.close(true);
  }

}
