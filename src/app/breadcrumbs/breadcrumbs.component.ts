import { Component, OnInit } from "@angular/core";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";

@Component({
  selector: "kubermatic-breadcrumbs",
  templateUrl: "./breadcrumbs.component.html",
  styleUrls: ["./breadcrumbs.component.scss"]
})
export class BreadcrumbsComponent implements OnInit {

  public activePageTitle: string = "";

  constructor(private _store: Store<fromRoot.State>) {
    this._store.select(fromRoot.getBreadcrumb).subscribe(crumb => {
      this.activePageTitle = crumb;
    });
  }

  ngOnInit() {
  }

}
