import {Component, OnInit, Input} from "@angular/core";
import {ClusterEntity} from "../../../shared/entity/ClusterEntity";

@Component({
  selector: "kubermatic-cluster-item",
  templateUrl: "./cluster-item.component.html",
  styleUrls: ["./cluster-item.component.scss"]
})
export class ClusterItemComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() index: number;

  constructor() {}

  ngOnInit() {
  }

  public getShortClusterName(): string {
    let name = this.cluster.spec.humanReadableName;

    return name.length > 12 ?  name.slice(0, 12) + '...' : name;
  }
}
