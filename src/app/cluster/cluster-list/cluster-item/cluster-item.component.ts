import {Component, OnInit, Input} from "@angular/core";

import {ClusterEntity} from "../../../shared/entity/ClusterEntity";

@Component({
  selector: "kubermatic-cluster-item",
  templateUrl: "./cluster-item.component.html",
  styleUrls: ["./cluster-item.component.scss"]
})
export class ClusterItemComponent implements OnInit {
  @Input() clusters: ClusterEntity;
  @Input() index: number

  constructor() {}

  ngOnInit() {}

  public getShortClusterName(name): string {
    return name.length > 12 ?  name.slice(0, 12) + '...' : name;
  }
}
