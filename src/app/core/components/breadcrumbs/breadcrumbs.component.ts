import { Observable } from 'rxjs';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, ProjectService } from '../../../core/services';
import { select } from '@angular-redux/store';

@Component({
  selector: 'kubermatic-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent implements OnInit {

  public activePageTitle = '';
  public clusterName = '';

  @select(['breadcrumb', 'crumb']) breadcrumb$: Observable<string>;

  constructor(private api: ApiService,
              private projectService: ProjectService,
              private router: Router) {
    this.breadcrumb$.subscribe(crumb => {
      this.activePageTitle = crumb;

      const regExpDatacenter = /\/cluster\/(.*)\/.*$/;
      const regExpCluster = /\/cluster\/.*\/(.*)$/;
      const matchResDatacenter = regExpDatacenter.exec(this.router.url);
      const matchResCluster = regExpCluster.exec(this.router.url);

      if (matchResDatacenter && matchResCluster) {
        this.clusterName = '...';
        const clusterId = matchResCluster[1];
        const datacenter = matchResDatacenter[1];
        this.projectService.selectedProjectChanges$.subscribe(project => {
          this.api.getCluster(clusterId, datacenter, project.id)
            .subscribe(cluster => this.clusterName = cluster.name);
        });
      } else {
        this.clusterName = '';
      }
    });
  }

  ngOnInit(): void {
  }

}
