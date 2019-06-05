import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../app-config.service';

import {ApiService, DatacenterService, ProjectService, UserService} from '../../core/services';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../shared/model/Config';
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
  displayedColumns: string[] = ['status', 'name', 'provider', 'region', 'type'];
  dataSource = new MatTableDataSource<ClusterEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _selectedProject = {} as ProjectEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _apiService: ApiService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _router: Router,
      private readonly _datacenterService: DatacenterService, private readonly _appConfig: AppConfigService,
      private readonly _activeRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this._selectedProject.id = this._activeRoute.snapshot.paramMap.get('projectID');
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        }))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    timer(0, 5 * this._appConfig.getRefreshTimeBase())
        .pipe(takeUntil(this._unsubscribe))
        .pipe(switchMap(() => this._apiService.getAllClusters(this._selectedProject.id)))
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

  isAddEnabled() {
    return !this._currentGroupConfig || this._currentGroupConfig.clusters.create;
  }

  loadWizard(): void {
    this._router.navigate([`/projects/${this._selectedProject.id}/wizard`]);
  }

  navigateToCluster(cluster: ClusterEntity): void {
    this._router.navigate(
        [`/projects/${this._selectedProject.id}/dc/${this.nodeDC[cluster.id].spec.seed}/clusters/${cluster.id}`]);
  }

  getProvider(cloud: CloudSpec): string {
    return ClusterUtils.getProvider(cloud);
  }

  getType(type: string): string {
    return ClusterUtils.getType(type);
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
        this._apiService.getClusterHealth(cluster.id, this.seedDC[cluster.id].metadata.name, this._selectedProject.id)
            .subscribe((health) => {
              this.health[cluster.id] = health;
            });
      }
    });
  }
}
