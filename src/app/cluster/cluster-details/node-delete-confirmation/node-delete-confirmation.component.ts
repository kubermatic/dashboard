import { Component, Input, OnInit, Output } from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import { CustomEventService } from 'app/core/services';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { NodeEntityV2 } from 'app/shared/entity/NodeEntity';
import { DataCenterEntity } from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './node-delete-confirmation.component.html',
  styleUrls: ['./node-delete-confirmation.component.scss']
})

export class NodeDeleteConfirmationComponent implements OnInit {

  @Input() node: NodeEntityV2;
  @Input() clusterName: string;
  @Input() datacenter: DataCenterEntity;

  public title: string;
  public message: string;
  public titleAlign?: string;
  public messageAlign?: string;
  public btnOkText?: string;
  public btnCancelText?: string;


  constructor(
    private api: ApiService,
    private customEventService: CustomEventService) {}

  ngOnInit() {
  }

  public deleteNode(): void {
    this.api.deleteClusterNode(this.clusterName, this.node, this.datacenter.spec.seed).subscribe(result => {
      NotificationActions.success('Success', `Node removed successfully`);
      this.customEventService.publish('onNodeDelete', this.node.metadata.name);
    });
  }
}
