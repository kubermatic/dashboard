import { Component, OnInit, OnDestroy } from '@angular/core';
import { Sort } from '@angular/material';
import { ApiService } from '../../core/services/api/api.service';
import { DatacenterService } from 'app/core/services';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
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
  public timer: any = Observable.timer(0, 10000);
  public sub: Subscription;
  public loading: boolean = true;

  public sortedData: ClusterEntity[] = [];
  public nodeDcList: string[] = [];
  public seedDcList: string[] = [];
  public nodeDc: DataCenterEntity[] = [];
  public seedDc: DataCenterEntity[] = [];

  constructor(public api: ApiService, private dcService: DatacenterService) {}

  ngOnInit() {
    this.sub = this.timer.subscribe(() => {
      this.getClusters();
    });
    this.sortData(null);
    this.getDatacenters();
  }

  getClusters() {
    this.api.getClusters().subscribe(result => {
      this.clusters = result;
      this.loading = false;
    });
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, item => {
      return item.metadata.name === cluster.metadata.name;
    });

    return prevCluster && prevCluster.status.phase === cluster.status.phase ? index : undefined;
  }

  getDatacenters() {
    if (this.clusters.length === 0) {
      this.api.getClusters().subscribe(result => {
        this.clusters = result;
        for (const i in this.clusters) {
          if (this.clusters.hasOwnProperty(i)) {
            if (!this.nodeDcList.some(x => x === this.clusters[i].spec.cloud.dc) && this.clusters[i].spec.cloud.dc !== '' && !this.clusters[i].spec.cloud.bringyourown) {
              this.nodeDcList.push(this.clusters[i].spec.cloud.dc);
            }
            if (!this.seedDcList.some(x => x === this.clusters[i].spec.seedDatacenterName)) {
              this.seedDcList.push(this.clusters[i].spec.seedDatacenterName);
            }
          }
        }
        this.loadDc();
      });
    } else {
      for (const i in this.clusters) {
        if (this.clusters.hasOwnProperty(i)) {
          if (!this.nodeDcList.some(x => x === this.clusters[i].spec.cloud.dc) && this.clusters[i].spec.cloud.dc !== '' && !this.clusters[i].spec.cloud.bringyourown) {
            this.nodeDcList.push(this.clusters[i].spec.cloud.dc);
          }
          if (!this.seedDcList.some(x => x === this.clusters[i].spec.seedDatacenterName)) {
            this.seedDcList.push(this.clusters[i].spec.seedDatacenterName);
          }
        }
      }
      this.loadDc();
    }
  }

  public loadDc(): void {
    if (this.nodeDcList) {
      for (const i in this.nodeDcList) {
        if (this.nodeDcList.hasOwnProperty(i)) {
          this.loadDataCenter(this.nodeDcList[i], 'nodeDc');
        }
      }
    }
    if (this.seedDcList) {
      for (const i in this.seedDcList) {
        if (this.seedDcList.hasOwnProperty(i)) {
          this.loadDataCenter(this.seedDcList[i], 'seedDc');
        }
      }
    }
  }

  public loadDataCenter(dcName: string, dcObjectName: string): Subscription {
    return this.dcService.getDataCenter(dcName).subscribe(
      res => {
        this[dcObjectName].push(new DataCenterEntity(res.metadata, res.spec, res.seed));
      }
    );
  }

  sortData(sort: Sort) {
    if (this.clusters.length === 0) {
      this.api.getClusters().subscribe(result => {
        this.clusters = result;
        this.getSortData(sort);
      });
    } else {
        this.getSortData(sort);
    }
  }

  getSortData(sort: Sort) {
    const data = this.clusters.slice();
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }

    this.sortedData = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.spec.humanReadableName, b.spec.humanReadableName, isAsc);
        case 'provider': return this.getProvider(a, b, isAsc);
        case 'seed-region': return this.compare(a.spec.seedDatacenterName, b.spec.seedDatacenterName, isAsc);
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
    this.sub.unsubscribe();
  }
}
