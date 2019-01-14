import {select} from '@angular-redux/store';
import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {ApiService} from '../../../core/services';

@Component({
  selector: 'kubermatic-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent implements OnInit {
  activePageTitle = '';
  clusterName = '';
  project = '';

  @select(['breadcrumb', 'crumb']) breadcrumb$: Observable<string>;

  constructor(private api: ApiService, private router: Router) {
    this.breadcrumb$.subscribe((crumb) => {
      this.activePageTitle = crumb;
      this.clusterName = '';
      this.project = '';

      const regExpProject = /\/projects\/([\w\d\-]*)\/./;
      const regExpDatacenter = /\/dc\/([\w\d\-]*)\/./;
      const regExpCluster = /\/clusters\/(.*)$/;
      const matchResProject = regExpProject.exec(this.router.url);
      const matchResDatacenter = regExpDatacenter.exec(this.router.url);
      const matchResCluster = regExpCluster.exec(this.router.url);

      if (matchResProject) {
        this.project = matchResProject[1];
        if (matchResDatacenter && matchResCluster) {
          this.api.getCluster(matchResCluster[1], matchResDatacenter[1], matchResProject[1]).subscribe((cluster) => {
            this.clusterName = cluster.name;
          });
        }
      }
    });
  }

  ngOnInit(): void {}
}
