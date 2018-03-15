import { Component, OnInit, OnDestroy } from '@angular/core';
import { Sort } from '@angular/material';
import { ApiService } from '../../core/services/api/api.service';
import { DatacenterService } from '../../core/services/datacenter/datacenter.service';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { find } from 'lodash';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public timer: any = Observable.timer(0, 5000);
  public sub: Subscription;
  public loading: boolean = true;
  public sortedData: ClusterEntity[] = [];

  constructor(public api: ApiService, public dcService: DatacenterService) {}

  ngOnInit() {
    this.sub = this.timer.subscribe(() => {
      this.getClusters();
    });
    this.sortData({active: 'name', direction: 'asc'});
  }

  getClusters() {
    let dcNames: string[];
    this.dcService.getSeedDataCenters().subscribe(res => {
      dcNames = res;
      for (const i in dcNames) {
        if (dcNames.hasOwnProperty(i)) {
          this.api.getClusters(dcNames[i]).subscribe(result => {
            this.clusters[dcNames[i]] = result;
            this.loading = false;
          });
        }
      }
    });
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, item => {
      return item.metadata.name === cluster.metadata.name;
    });

    return prevCluster && prevCluster.status.phase === cluster.status.phase ? index : undefined;
  }

  sortData(sort: Sort) {
    let dcNames: string[];
    this.dcService.getSeedDataCenters().subscribe(res => {
      dcNames = res;
      for (const i in dcNames) {
        if (!this.clusters[dcNames[i]]) {
          this.api.getClusters(dcNames[i]).subscribe(result => {
            this.clusters[dcNames[i]] = result;
            this.getSortData(sort);
          });
        } else {
          this.getSortData(sort);
        }
      }
    });
  }

  getSortData(sort: Sort) {
    const data = [];
    for (const i in this.clusters) {
      if (this.clusters.hasOwnProperty(i)) {
        for (const j in this.clusters[i]) {
          if (this.clusters[i].hasOwnProperty(j)) {
            data.push(this.clusters[i][j]);
          }
        }
      }
    }

    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.spec.humanReadableName, b.spec.humanReadableName, isAsc);
        case 'provider': return this.getProvider(a, b, isAsc);
        case 'region': return this.compare(a.spec.cloud.dc, b.spec.cloud.dc, isAsc);
        case 'status': return this.compare(a.status.phase, b.status.phase, isAsc);
        default: return 0;
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

  ngOnDestroy() {
    this.sub && this.sub.unsubscribe();
  }
}
