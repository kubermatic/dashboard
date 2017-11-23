import { Component, OnInit } from "@angular/core";
import {Router} from '@angular/router';
import {Store} from "@ngrx/store";
import * as fromRoot from "../../../redux/reducers/index";
import {ApiService} from '../../../api/api.service';
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

      const regExp = /\/cluster\/(.*)$/;
      let matchRes = regExp.exec(this.router.url);

      if(matchRes) {
        this.clusterName = '...';
        let clusterId = matchRes[1];
        this.api.getCluster(clusterId)
          .subscribe(cluster => this.clusterName = cluster.spec.humanReadableName);
      } else {
        this.clusterName = '';
      }
    });
  }

  ngOnInit() {
  }

}
