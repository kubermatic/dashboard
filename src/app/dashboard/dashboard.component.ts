import { Component, OnInit } from "@angular/core";
import {ApiService} from "../api/api.service";
import {DataCenterEntity} from "../api/entitiy/DatacenterEntity";

@Component({
  selector: "kubermatic-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {

  private current: number = 1;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.api.getDataCenters().subscribe(result => {
      let seedDataCenters: DataCenterEntity[] = result.filter(elem => elem.seed)
        .sort((a, b) => DataCenterEntity.sortByName(a, b));

      console.log(JSON.stringify(seedDataCenters));
    });
  }
}
