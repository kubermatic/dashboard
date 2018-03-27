import { Component, Input, OnInit } from '@angular/core';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';
import { NodeEntityV2 } from '../../../shared/entity/NodeEntity';
import { ApiService } from '../../../core/services';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './node-delete-confirmation.component.html',
  styleUrls: ['./node-delete-confirmation.component.scss']
})

export class NodeDeleteConfirmationComponent implements OnInit {

  @Input() node: NodeEntityV2;
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;

  public title: string;
  public message: string;
  public titleAlign?: string;
  public messageAlign?: string;
  public btnOkText?: string;
  public btnCancelText?: string;

  constructor(private api: ApiService) {
  }

  ngOnInit() {
  }

  public deleteNode(): void {
    this.api.deleteClusterNode(this.cluster.metadata.name, this.node, this.datacenter.metadata.name).subscribe(result => {
      NotificationActions.success('Success', `Node removed successfully`);
      //todo: emit event
    });
  }
}
