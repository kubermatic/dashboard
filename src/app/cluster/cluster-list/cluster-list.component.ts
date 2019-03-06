import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {find} from 'lodash';
import {interval, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {AppConfigService} from '../../app-config.service';
import {ApiService, DatacenterService, UserService} from '../../core/services';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {UserGroupConfig} from '../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
})
export class ClusterListComponent implements OnInit, OnDestroy {
  clusters: ClusterEntity[] = [];
  loading = true;
  sortedData: ClusterEntity[] = [];
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  nodeDC: DataCenterEntity[] = [];
  seedDC: DataCenterEntity[] = [];
  provider = [];
  displayedColumns: string[] = ['status', 'name', 'provider', 'region'];
  dataSource = new MatTableDataSource<ClusterEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private subscriptions: Subscription[] = [];

  constructor(
      private api: ApiService, private route: ActivatedRoute, private appConfigService: AppConfigService,
      private router: Router, private userService: UserService, private dcService: DatacenterService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.route.paramMap.subscribe((m) => {
      this.projectID = m.get('projectID');
      this.refreshClusters();
    }));

    this.userGroupConfig = this.appConfigService.getUserGroupConfig();

    this.userService.currentUserGroup(this.projectID).subscribe((group) => {
      this.userGroup = group;
    });

    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this.subscriptions.push(interval(5000).subscribe(() => {
      this.refreshClusters();
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getDataSource(): MatTableDataSource<ClusterEntity> {
    this.dataSource.data = this.clusters;
    return this.dataSource;
  }

  refreshClusters(): void {
    this.api.getAllClusters(this.projectID).pipe(first()).subscribe(c => {
      this.clusters = c;
      this.loading = false;
      this.loadNodeDc();
    });

    this.userService.currentUserGroup(this.projectID).pipe(first()).subscribe(ug => {
      this.userGroup = ug;
    });
  }

  trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, (item) => {
      return item.name === cluster.name;
    });
    return prevCluster ? index : undefined;
  }

  loadWizard(): void {
    this.router.navigate(['/projects/' + this.projectID + '/wizard']);
  }

  navigateToCluster(cluster: ClusterEntity): void {
    this.router.navigate(
        ['/projects/' + this.projectID + '/dc/' + this.nodeDC[cluster.id].spec.seed + '/clusters/' + cluster.id]);
  }

  getProvider(cloud: CloudSpec): string {
    if (cloud.aws) {
      return 'aws';
    } else if (cloud.digitalocean) {
      return 'digitalocean';
    } else if (cloud.openstack) {
      return 'openstack';
    } else if (cloud.bringyourown) {
      return 'bringyourown';
    } else if (cloud.hetzner) {
      return 'hetzner';
    } else if (cloud.vsphere) {
      return 'vsphere';
    } else if (cloud.azure) {
      return 'azure';
    }
  }

  loadNodeDc() {
    for (const cluster of this.clusters) {
      this.dcService.getDataCenter(cluster.spec.cloud.dc).subscribe((result) => {
        this.nodeDC[cluster.id] = result;
        this.dcService.getDataCenter(this.nodeDC[cluster.id].spec.seed).subscribe((seedRes) => {
          this.seedDC[cluster.id] = seedRes;
        });
      });
    }
  }
}
