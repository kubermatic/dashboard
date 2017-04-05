import { Component, OnInit, Input } from '@angular/core';
import { ApiService } from "../../api/api.service";
import { ClusterModel } from "../../api/model/ClusterModel";

import { NodeEntity } from "../../api/entitiy/NodeEntity";

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

  public clusterModel: ClusterModel;
  public node: NodeEntity;

  constructor(private api: ApiService) {}

  ngOnInit() {

  }

  public deleteNode(): void {
    this.clusterModel = new ClusterModel(this.seedDcName, this.clusterName);
    this.api.deleteClusterNode(this.clusterModel, this.nodeUID).subscribe(result => {
      this.node = result;
    })
  }
}
