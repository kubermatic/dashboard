import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material';
import { ApiService } from '../../core/services/api/api.service';
import { DatacenterService } from '../../core/services/datacenter/datacenter.service';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { Observable, ObservableInput } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { find } from 'lodash';
import { ClusterService } from '../../core/services';

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
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private dcService: DatacenterService,
              private clusterService: ClusterService) {
  }

  ngOnInit() {
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
        dcClustersObservables.push(this.api.getClusters(dc.metadata.name));
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
      return item.metadata.name === cluster.metadata.name;
    });

    return prevCluster && this.clusterService.isClusterRunning(prevCluster) === this.clusterService.isClusterRunning(cluster) ? index : undefined;
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
          return this.compare(a.spec.humanReadableName, b.spec.humanReadableName, isAsc);
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
