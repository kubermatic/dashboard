import {Component, OnInit, Input} from "@angular/core";
import {ClusterEntity} from "../../api/entitiy/ClusterEntity";
import { DatacenterService } from './../../services/datacenter/datacenter.service';

@Component({
  selector: "kubermatic-cluster-item",
  templateUrl: "./cluster-item.component.html",
  styleUrls: ["./cluster-item.component.scss"]
})
export class ClusterItemComponent implements OnInit {
  @Input() clusters: ClusterEntity;
  @Input() index: number

  constructor(public dcService: DatacenterService) {}

  ngOnInit() {}


  public getShortClusterName(name): string {
    return name.length > 12 ?  name.slice(0, 12) + '...': name;
  }
}
