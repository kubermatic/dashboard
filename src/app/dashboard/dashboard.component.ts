import { BreadcrumbActions } from './../redux/actions/breadcrumb.actions';
import {Component, OnInit} from "@angular/core";
import {Auth} from "../core/services";
import {Router, NavigationEnd, ActivatedRoute} from "@angular/router";
import "rxjs/add/operator/filter";
import {ApiService} from "app/core/services/api/api.service";

@Component({
  selector: "kubermatic-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {

  constructor(private auth: Auth, 
              private router: Router, 
              private activatedRoute: ActivatedRoute,
              private api: ApiService,
              private breadcrumbActions: BreadcrumbActions) {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map(route => {
        while (route.firstChild) {
          route = route.firstChild;
        }

        return route;
      })
      .filter(route => route.outlet === "primary")
      .mergeMap(route => route.data)
      .subscribe((event) => {
        this.breadcrumbActions.putBreadcrumb(event['title']);
      });
  }

  ngOnInit() {
    if (this.auth.authenticated()) {
      this.api.getClusters().subscribe(result => {
        if (!result) {
          this.router.navigate(["wizard"]);
        }
      }, error => {
        this.router.navigate(["wizard"]);
      });
    }
  }
}
