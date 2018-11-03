import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { find } from 'lodash';
import { combineLatest, interval, ObservableInput, Subscription } from 'rxjs';
import { AppConfigService } from '../../app-config.service';
import { ApiService, DatacenterService, UserService } from '../../core/services';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { UserGroupConfig } from '../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public loading = true;
  public sortedData: ClusterEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public projectID: string;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private route: ActivatedRoute,
              private appConfigService: AppConfigService,
              private router: Router,
              private dcService: DatacenterService,
              private userService: UserService) {
  }

  ngOnInit(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    this.subscriptions.push(this.route.paramMap.subscribe((m) => {
      this.projectID = m.get('projectID');
      this.refreshClusters();
    }));

    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });

    this.subscriptions.push(interval(5000).subscribe(() => {
      this.refreshClusters();
    }));

    this.refreshClusters();
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshClusters(): void {
    this.subscriptions.push(this.dcService.getSeedDataCenters().subscribe((datacenters) => {
      const clusters: ClusterEntity[] = [];
      const dcClustersObservables: Array<ObservableInput<ClusterEntity[]>> = [];
      for (const dc of datacenters) {
        dcClustersObservables.push(this.api.getClusters(dc.metadata.name, this.projectID));
      }
      this.subscriptions.push(combineLatest(dcClustersObservables)
        .subscribe((dcClusters) => {
          for (const cs of dcClusters) {
            clusters.push(...cs);
          }
          this.clusters = clusters;
          this.sortData(this.sort);
          this.loading = false;
        }));
      this.userService.currentUserGroup(this.projectID).subscribe((group) => {
        this.userGroup = group;
      });
    }));
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, (item) => {
      return item.name === cluster.name;
    });
    return prevCluster ? index : undefined;
  }

  public loadWizard(): void {
    this.router.navigate(['/projects/' + this.projectID + '/wizard']);
  }

  sortData(sort: Sort): void {
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
          return this.compare(this.getProviderName(a), this.getProviderName(b), isAsc);
        case 'region':
          return this.compare(a.spec.cloud.dc, b.spec.cloud.dc, isAsc);
        default:
          return 0;
      }
    });
  }

  private getProviderName(cluster: ClusterEntity): string {
    if (cluster.spec.cloud.digitalocean) {
      return 'digitalocean';
    } else if (cluster.spec.cloud.bringyourown) {
      return 'bringyourown';
    } else if (cluster.spec.cloud.aws) {
      return 'aws';
    } else if (cluster.spec.cloud.openstack) {
      return 'openstack';
    }
    return '';
  }

  compare(a, b, isAsc): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
