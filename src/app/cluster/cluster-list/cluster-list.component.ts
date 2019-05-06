import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatTableDataSource} from '@angular/material';
import {Router} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../app-config.service';

import {ApiService, DatacenterService, ProjectService} from '../../core/services';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss'],
})
export class ClusterListComponent implements OnInit, OnDestroy {
  clusters: ClusterEntity[] = [];
  isInitialized = true;
  nodeDC: DataCenterEntity[] = [];
  seedDC: DataCenterEntity[] = [];
  health: HealthEntity[] = [];
  provider = [];
  displayedColumns: string[] = ['status', 'name', 'provider', 'region'];
  dataSource = new MatTableDataSource<ClusterEntity>();
  @ViewChild(MatSort) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _router: Router, private readonly _datacenterService: DatacenterService,
      private readonly _appConfig: AppConfigService) {}

  ngOnInit(): void {
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    timer(0, 5 * this._appConfig.getRefreshTimeBase())
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._apiService.getAllClusters(this._projectService.getCurrentProjectId())))
        .subscribe(clusters => {
          this.clusters = clusters;
          this._loadNodeDc();
          this._loadClusterHealth();
          this.isInitialized = false;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getDataSource(): MatTableDataSource<ClusterEntity> {
    this.dataSource.data = this.clusters;
    return this.dataSource;
  }

  getHealthStatus(cluster: ClusterEntity): ClusterHealthStatus {
    return ClusterHealthStatus.getHealthStatus(cluster, this.health[cluster.id]);
  }

  isAddEnabled(): boolean {
    return !this._projectService.getUserGroupConfig() || this._projectService.getUserGroupConfig().clusters.create;
  }

  loadWizard(): void {
    this._router.navigate(['/projects/' + this._projectService.getCurrentProjectId() + '/wizard']);
  }

  navigateToCluster(cluster: ClusterEntity): void {
    this._router.navigate(
        ['/projects/' + this._projectService.getCurrentProjectId() + '/dc/' + this.nodeDC[cluster.id].spec.seed +
         '/clusters/' + cluster.id]);
  }

  getProvider(cloud: CloudSpec): string {
    return ClusterUtils.getProvider(cloud);
  }

  private _loadNodeDc(): void {
    this.clusters.forEach(cluster => {
      this._datacenterService.getDataCenter(cluster.spec.cloud.dc).subscribe((result) => {
        this.nodeDC[cluster.id] = result;
        this._datacenterService.getDataCenter(this.nodeDC[cluster.id].spec.seed).subscribe((seedRes) => {
          this.seedDC[cluster.id] = seedRes;
        });
      });
    });
  }

  private _loadClusterHealth(): void {
    this.clusters.forEach(cluster => {
      if (!!this.seedDC[cluster.id]) {
        this._apiService
            .getClusterHealth(
                cluster.id, this.seedDC[cluster.id].metadata.name, this._projectService.getCurrentProjectId())
            .subscribe((health) => {
              this.health[cluster.id] = health;
            });
      }
    });
  }
}
