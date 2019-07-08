import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatDialog, MatSort, MatTableDataSource} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {EMPTY, forkJoin, onErrorResumeNext, Subject} from 'rxjs';
import {catchError, distinctUntilChanged, switchMap, takeUntil, tap} from 'rxjs/operators';

import {ClusterService, DatacenterService, ProjectService, UserService} from '../../core/services';
import {CloudSpec, ClusterEntity} from '../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';
import {HealthEntity} from '../../shared/entity/HealthEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {GroupConfig} from '../../shared/model/Config';
import {ClusterUtils} from '../../shared/utils/cluster-utils/cluster-utils';
import {ClusterHealthStatus} from '../../shared/utils/health-status/cluster-health-status';
import {ClusterDeleteConfirmationComponent} from '../cluster-details/cluster-delete-confirmation/cluster-delete-confirmation.component';


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
  displayedColumns: string[] = ['status', 'name', 'provider', 'region', 'type', 'actions'];
  dataSource = new MatTableDataSource<ClusterEntity>();
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  private _unsubscribe: Subject<any> = new Subject();
  private _selectedProject = {} as ProjectEntity;
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _clusterService: ClusterService, private readonly _projectService: ProjectService,
      private readonly _userService: UserService, private readonly _router: Router,
      private readonly _datacenterService: DatacenterService, private readonly _activeRoute: ActivatedRoute,
      private readonly _matDialog: MatDialog) {}

  ngOnInit(): void {
    this._selectedProject.id = this._activeRoute.snapshot.paramMap.get('projectID');
    this.dataSource.sort = this.sort;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._projectService.selectedProject
        .pipe(switchMap(project => {
          this._selectedProject = project;
          return this._userService.currentUserGroup(project.id);
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    this._projectService
        .selectedProject
        // Do not allow project refresh to fire clusters refresh unless project has been changed.
        .pipe(distinctUntilChanged((p: ProjectEntity, q: ProjectEntity) => p.id === q.id))
        .pipe(switchMap(project => this._clusterService.clusters(project.id)))
        .pipe(switchMap((clusters: ClusterEntity[]) => {
          this.clusters = clusters;
          this.isInitialized = false;

          return forkJoin(clusters.map(cluster => {
            return this._datacenterService.getDataCenter(cluster.spec.cloud.dc)
                .pipe(tap(datacenter => this.nodeDC[cluster.id] = datacenter))
                .pipe(switchMap(datacenter => this._datacenterService.getDataCenter(datacenter.spec.seed)))
                .pipe(tap(seedDatacenter => this.seedDC[cluster.id] = seedDatacenter))
                .pipe(switchMap(
                    seedDatacenter => this._clusterService.health(
                        this._selectedProject.id, cluster.id, seedDatacenter.metadata.name)))
                // We need to resume on error, otherwise subscription will be canceled and clusters will stop
                // refreshing.
                .pipe(catchError(() => onErrorResumeNext(EMPTY)))
                .pipe(tap(health => this.health[cluster.id] = health));
          }));
        }))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe();
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

  deleteClusterDialog(cluster: ClusterEntity, event: Event): void {
    event.stopPropagation();
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = cluster;
    modal.componentInstance.datacenter = this.seedDC[cluster.id];
    modal.componentInstance.projectID = this._selectedProject.id;
  }
}
