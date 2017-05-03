import { Component, OnInit, Input} from "@angular/core";
import { NodeEntity } from "../../api/entitiy/NodeEntity";
import {MdDialog} from '@angular/material';
import {NodeDeleteConfirmationComponent} from "../node-delete-confirmation/node-delete-confirmation.component";

@Component({
  selector: "kubermatic-node",
  templateUrl: "node.component.html",
  styleUrls: ["node.component.scss"]
})
export class NodeComponent implements OnInit {
  @Input() node: NodeEntity;
  @Input() clusterName: string;
  @Input() seedDcName: string;
  @Input() nodeProvider: string;
  @Input() index: number;
  public dialogRef: any;
  public config: any = {};

  constructor(public dialog: MdDialog) {}

  ngOnInit() {

  }

  public deleteNodeDialog(): void {
    this.dialogRef = this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    this.dialogRef.componentInstance.nodeName = this.node.metadata.name;
    this.dialogRef.componentInstance.nodeUID = this.node.metadata.uid;
    this.dialogRef.componentInstance.clusterName = this.clusterName;
    this.dialogRef.componentInstance.seedDcName = this.seedDcName;


    this.dialogRef.afterClosed().subscribe(result => {});
  }

}


