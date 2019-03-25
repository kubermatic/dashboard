import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {interval, Subscription} from 'rxjs';
import {first} from 'rxjs/operators';

import {AppConfigService} from '../../app-config.service';
import {ApiService, DatacenterService, UserService} from '../../core/services';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {UserGroupConfig} from '../../shared/model/Config';
import {ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
})
export class ClusterListComponent implements OnInit, OnDestroy {
  clusters: ClusterEntity[] = [];
  loading = true;
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;
  nodeDC: DataCenterEntity[] = [];
  seedDC: DataCenterEntity[] = [];
  health: HealthEntity[] = [];
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
      this.loadClusterHealth();
    });

    this.userService.currentUserGroup(this.projectID).pipe(first()).subscribe(ug => {
      this.userGroup = ug;
    });
  }

  getHealthStatus(cluster: ClusterEntity): ClusterHealthStatus {
    return ClusterHealthStatus.getHealthStatus(cluster, this.health[cluster.id]);
  }

  loadWizard(): void {
    this.router.navigate(['/projects/' + this.projectID + '/wizard']);
  }

  navigateToCluster(cluster: ClusterEntity): void {
    this.router.navigate(
        ['/projects/' + this.projectID + '/dc/' + this.nodeDC[cluster.id].spec.seed + '/clusters/' + cluster.id]);
  }

  getProvider(cloud: CloudSpec): string {
    return ClusterUtils.getProvider(cloud);
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

  loadClusterHealth() {
    for (const cluster of this.clusters) {
      if (!!this.seedDC[cluster.id]) {
        this.api.getClusterHealth(cluster.id, this.seedDC[cluster.id].metadata.name, this.projectID)
            .subscribe((health) => {
              this.health[cluster.id] = health;
            });
      }
    }
  }
}
