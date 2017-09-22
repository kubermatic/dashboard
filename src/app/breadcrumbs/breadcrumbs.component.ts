import { Component, OnInit } from "@angular/core";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {ApiService} from '../api/api.service';
import {Router} from '@angular/router';
import {ClusterModel} from '../api/model/ClusterModel';
@Component({
  selector: "kubermatic-breadcrumbs",
  templateUrl: "./breadcrumbs.component.html",
  styleUrls: ["./breadcrumbs.component.scss"]
})
export class BreadcrumbsComponent implements OnInit {

  public activePageTitle: string = "";
  public clusterName: string = '';
  
  constructor(
    private store: Store<fromRoot.State>, 
    private api: ApiService, 
    private router: Router
  ) {
    this.store.select(fromRoot.getBreadcrumb).subscribe(crumb => {
      this.activePageTitle = crumb;

      const regExp = /dc\/(.*)\/cluster\/(.*)$/;
      let matchRes = regExp.exec(this.router.url);

      if(matchRes) {
        this.clusterName = '...';
        let dc = matchRes[1];
        let clusterId = matchRes[2];
        this.api.getCluster(new ClusterModel(dc,clusterId))
          .subscribe(cluster => this.clusterName = cluster.spec.humanReadableName);
      } else {
        this.clusterName = '';
      }
    });
  }

  ngOnInit() {
  }

}
