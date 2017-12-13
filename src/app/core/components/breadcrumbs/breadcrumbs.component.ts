import { Observable } from 'rxjs/Observable';
import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ApiService} from 'app/core/services/api/api.service';
import { select } from '@angular-redux/store';
import { Breadcrumb } from 'app/redux/reducers/breadcrumb';

@Component({
  selector: 'kubermatic-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent implements OnInit {

  public activePageTitle: string = '';
  public clusterName: string = '';

  @select(['breadcrumb', 'crumb']) breadcrumb$: Observable<string>;

  constructor(
    private api: ApiService,
    private router: Router
  ) {
    this.breadcrumb$.subscribe(crumb => {
      this.activePageTitle = crumb;

      const regExp = /\/cluster\/(.*)$/;
      const matchRes = regExp.exec(this.router.url);

      if (matchRes) {
        this.clusterName = '...';
        const clusterId = matchRes[1];
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
