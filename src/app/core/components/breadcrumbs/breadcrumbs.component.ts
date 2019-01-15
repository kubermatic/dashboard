import {select} from '@angular-redux/store';
import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Observable} from 'rxjs';
import {first} from 'rxjs/operators';

import {ApiService} from '../../services';

@Component({
  selector: 'kubermatic-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss'],
})
export class BreadcrumbsComponent {
  activePageTitle = '';
  project = '';
  datacenter = '';
  cluster = '';
  clusterName = '';
  nodeDeployment = '';
  nodeDeploymentName = '';

  @select(['breadcrumb', 'crumb']) breadcrumb$: Observable<string>;

  constructor(private api: ApiService, private router: Router) {
    this.breadcrumb$.subscribe((crumb) => {
      this.activePageTitle = crumb;
      this.project = '';
      this.datacenter = '';
      this.cluster = '';
      this.clusterName = '';
      this.nodeDeployment = '';
      this.nodeDeploymentName = '';

      const regExpProject = /\/projects\/([\w\d\-]*)\/./;
      const regExpDatacenter = /\/dc\/([\w\d\-]*)\/./;
      const regExpCluster = /\/clusters\/([\w\d\-]*)\/?.?/;
      const regExpNodeDeployment = /\/nd\/(.*)$/;
      const matchResProject = regExpProject.exec(this.router.url);
      const matchResDatacenter = regExpDatacenter.exec(this.router.url);
      const matchResCluster = regExpCluster.exec(this.router.url);
      const matchResNodeDeployment = regExpNodeDeployment.exec(this.router.url);

      if (matchResProject) {
        this.project = matchResProject[1];

        if (matchResDatacenter && matchResCluster) {
          this.datacenter = matchResDatacenter[1];
          this.cluster = matchResCluster[1];
          this.api.getCluster(this.cluster, this.datacenter, this.project).pipe(first()).subscribe((c) => {
            this.clusterName = c.name;
          });

          if (matchResNodeDeployment) {
            this.nodeDeployment = matchResNodeDeployment[1];
            this.api.getNodeDeployment(this.nodeDeployment, this.cluster, this.datacenter, this.project)
                .pipe(first())
                .subscribe((nd) => {
                  this.nodeDeploymentName = nd.name;
                });
          }
        }
      }
    });
  }
}
