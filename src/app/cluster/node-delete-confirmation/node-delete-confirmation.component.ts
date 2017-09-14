import {Component, Input, OnInit, Output} from '@angular/core';
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {ApiService} from "../../api/api.service";
import {ClusterModel} from "../../api/model/ClusterModel";
import {NodeEntity} from "../../api/entitiy/NodeEntity";
import {NotificationComponent} from "../../notification/notification.component";
import {CustomEventService} from '../../services';

@Component({
  selector: 'kubermatic-node-delete-confirmation',
  templateUrl: './node-delete-confirmation.component.html',
  styleUrls: ['./node-delete-confirmation.component.scss']
})

export class NodeDeleteConfirmationComponent implements OnInit {

  @Input() nodeUID: string;
  @Input() nodeName: string;
  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() onNodeRemoval;

  public clusterModel: ClusterModel;
  public node: NodeEntity;

  public title: string;
  public message: string;
  public titleAlign?: string;
  public messageAlign?: string;
  public btnOkText?: string;
  public btnCancelText?: string;


  constructor(
    private api: ApiService, 
    private store: Store<fromRoot.State>, 
    private customEventService: CustomEventService
  ) {}

  ngOnInit() {
  }

  public deleteNode(nodeName: string): void {
    this.onNodeRemoval(true);
    this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
    this.api.deleteClusterNode(this.clusterModel, nodeName).subscribe(result => {
      NotificationComponent.success(this.store, "Success", `Node removed successfully`);
      this.customEventService.publish('onNodeDelete', nodeName);
      this.onNodeRemoval(false);
    }, error => {
      NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`);
    })
  }
}
