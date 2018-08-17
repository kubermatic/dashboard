import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material';
import { ApiService, DatacenterService, ProjectService } from '../../core/services';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { find } from 'lodash';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public loading = true;
  public sortedData: ClusterEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private dcService: DatacenterService,
              private projectService: ProjectService) {
  }

  ngOnInit() {
    this.project = this.projectService.project;

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    const timer = Observable.interval(5000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshClusters();
    }));
    this.refreshClusters();
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshClusters() {
    this.subscriptions.push(this.dcService.getSeedDataCenters().subscribe(datacenters => {
      const clusters: ClusterEntity[] = [];
      const dcClustersObservables: Array<ObservableInput<ClusterEntity[]>> = [];
      for (const dc of datacenters) {
        dcClustersObservables.push(this.api.getClusters(dc.metadata.name, this.project.id));
      }
      this.subscriptions.push(Observable.combineLatest(dcClustersObservables)
        .subscribe(dcClusters => {
          for (const cs of dcClusters) {
            clusters.push(...cs);
          }
          this.clusters = clusters;
          this.sortData(this.sort);
          this.loading = false;
        }));
    }));
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, item => {
      return item.name === cluster.name;
    });
    return prevCluster ? index : undefined;
  }

  sortData(sort: Sort) {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedData = this.clusters;
      return;
    }

    this.sort = sort;

    this.sortedData = this.clusters.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'provider':
          return this.getProvider(a, b, isAsc);
        case 'region':
          return this.compare(a.spec.cloud.dc, b.spec.cloud.dc, isAsc);
        default:
          return 0;
      }
    });
  }

  getProvider(a, b, isAsc) {
    let aProvider: string;
    let bProvider: string;

    if (a.spec.cloud.digitalocean) {
      aProvider = 'digitalocean';
    } else if (a.spec.cloud.bringyourown) {
      aProvider = 'bringyourown';
    } else if (a.spec.cloud.aws) {
      aProvider = 'aws';
    } else if (a.spec.cloud.openstack) {
      aProvider = 'openstack';
    } else {
      aProvider = '';
    }

    if (b.spec.cloud.digitalocean) {
      bProvider = 'digitalocean';
    } else if (b.spec.cloud.bringyourown) {
      bProvider = 'bringyourown';
    } else if (b.spec.cloud.aws) {
      bProvider = 'aws';
    } else if (b.spec.cloud.openstack) {
      bProvider = 'openstack';
    } else {
      bProvider = '';
    }

    return this.compare(aProvider, bProvider, isAsc);
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
