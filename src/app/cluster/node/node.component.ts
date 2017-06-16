import { Component, OnInit, Input} from "@angular/core";
import { NodeEntity } from "../../api/entitiy/NodeEntity";
import {MdDialog, MdDialogRef, MdDialogConfig} from '@angular/material';
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
  public config: MdDialogConfig = {
    disableClose: false,
    //panelClass: 'custom-overlay-pane-class',
    hasBackdrop: true,
    backdropClass: '',
    width: '',
    height: '',
    position: {
      top: '',
      bottom: '',
      left: '',
      right: ''
    },
    data: {
      nodeName: '',
      nodeUID: '',
      clusterName: '',
      seedDcName: ''
    }
  };

  constructor(public dialog: MdDialog, public dialogRef: MdDialogRef<NodeDeleteConfirmationComponent>) {}

  ngOnInit() {

  }

  public deleteNodeDialog(): void {
    this.dialog.open(NodeDeleteConfirmationComponent, this.config);
    this.dialogRef.componentInstance.nodeName = this.node.metadata.name;
    this.dialogRef.componentInstance.nodeUID = this.node.metadata.uid;
    this.dialogRef.componentInstance.clusterName = this.clusterName;
    this.dialogRef.componentInstance.seedDcName = this.seedDcName;

    //this.data = this.dialogRef.componentInstance;

    this.dialogRef.afterClosed().subscribe(result => {});
  }

}


