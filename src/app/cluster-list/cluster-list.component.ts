import {Component, OnInit, OnDestroy} from "@angular/core";
import {ApiService} from "../api/api.service";
import {ClusterEntity} from "../api/entitiy/ClusterEntity";



import {Observable, Subscription} from "rxjs";

import { RouterModule, Routes } from '@angular/router';

@Component({
  selector: "kubermatic-cluster-list",
  templateUrl: "./cluster-list.component.html",
  styleUrls: ["./cluster-list.component.scss"]
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public timer: any = Observable.timer(0,10000);
  public sub: Subscription;

  constructor(private api: ApiService) { }

  ngOnInit() {
    this.sub = this.timer.subscribe(() => {
      this.getClusters();
    });
  }

  getClusters(){
    this.api.getClusters().subscribe(result => {
      this.clusters = result;

      console.log(this.clusters);
      debugger;
    });
  }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }
}
