import {Component, OnInit, Input} from "@angular/core";
import {ClusterEntity} from "../../api/entitiy/ClusterEntity";

@Component({
  selector: "kubermatic-cluster-item",
  templateUrl: "./cluster-item.component.html",
  styleUrls: ["./cluster-item.component.scss"]
})
export class ClusterItemComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() index: number

  public clusterUri : string = '/dc/' + this.cluster.dc.metadata.name + '/cluster/' + this.cluster.metadata.name;

  constructor() {}

  ngOnInit() {
  }
}
