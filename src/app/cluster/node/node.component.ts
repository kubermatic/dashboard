import { Component, OnInit, Input} from "@angular/core";
import { NodeEntity } from "../../api/entitiy/NodeEntity";

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

  constructor() { }

  ngOnInit() {

  }

}
