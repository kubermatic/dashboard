import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {interval, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {ApiService, DatacenterService, ProjectService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {ClusterUtils} from '../../../shared/utils/cluster-utils/cluster-utils';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
import {NodeUtils} from '../../../shared/utils/node-utils/node-utils';
import {NodeService} from '../../services/node.service';

@Component({
  selector: 'km-node-deployment-details',
  templateUrl: './node-deployment-details.component.html',
  styleUrls: ['./node-deployment-details.component.scss'],
})
export class NodeDeploymentDetailsComponent implements OnInit, OnDestroy {
  nodeDeployment: NodeDeploymentEntity;
  nodeDeploymentHealthStatus: NodeDeploymentHealthStatus;
  nodes: NodeEntity[] = [];
  events: EventEntity[] = [];
  cluster: ClusterEntity;
  clusterProvider: string;
  datacenter: DataCenterEntity;
  seedDatacenter: DataCenterEntity;
  system: string;
  private _clusterName: string;
  private _dcName: string;
  private _nodeDeploymentID: string;
  private _isNodeDeploymentLoaded = false;
  private _areNodesLoaded = false;
  private _areNodesEventsLoaded = false;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;
  private _isSeedDatacenterLoaded = false;
  private _refreshInterval = 10000;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private readonly _activatedRoute: ActivatedRoute,
      private readonly _router: Router,
      private readonly _apiService: ApiService,
      private readonly _datacenterService: DatacenterService,
      private readonly _nodeService: NodeService,
      private readonly _projectService: ProjectService,
  ) {}

  ngOnInit(): void {
    this._clusterName = this._activatedRoute.snapshot.paramMap.get('clusterName');
    this._dcName = this._activatedRoute.snapshot.paramMap.get('seedDc');
    this._nodeDeploymentID = this._activatedRoute.snapshot.paramMap.get('nodeDeploymentID');

    this.loadNodeDeployment();
    this.loadNodes();
    this.loadNodesEvents();
    this.loadSeedDatacenter();
    this.loadCluster();

    interval(this._refreshInterval).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.loadNodeDeployment();
      this.loadNodes();
      this.loadNodesEvents();
    });
  }

  loadNodeDeployment(): void {
    this._apiService
        .getNodeDeployment(this._nodeDeploymentID, this._clusterName, this._dcName, this._projectService.project.id)
        .pipe(first())
        .subscribe((nd: NodeDeploymentEntity) => {
          this.nodeDeployment = nd;
          this.system = NodeUtils.getOperatingSystem(this.nodeDeployment.spec.template);
          this.nodeDeploymentHealthStatus = NodeDeploymentHealthStatus.getHealthStatus(this.nodeDeployment);
          this._isNodeDeploymentLoaded = true;
        });
  }

  loadNodes(): void {
    this._apiService
        .getNodeDeploymentNodes(
            this._nodeDeploymentID, this._clusterName, this._dcName, this._projectService.project.id)
        .pipe(first())
        .subscribe((n) => {
          this.nodes = n;
          this._areNodesLoaded = true;
        });
  }

  loadNodesEvents(): void {
    this._apiService
        .getNodeDeploymentNodesEvents(
            this._nodeDeploymentID, this._clusterName, this._dcName, this._projectService.project.id)
        .pipe(first())
        .subscribe((e) => {
          this.events = e;
          this._areNodesEventsLoaded = true;
        });
  }

  loadCluster(): void {
    this._apiService.getCluster(this._clusterName, this._dcName, this._projectService.project.id)
        .pipe(first())
        .subscribe((c) => {
          this.cluster = c;
          this.clusterProvider = ClusterUtils.getProvider(this.cluster.spec.cloud);
          this._isClusterLoaded = true;
          this.loadDatacenter();
        });
  }

  loadDatacenter(): void {
    this._datacenterService.getDataCenter(this.cluster.spec.cloud.dc).pipe(first()).subscribe((d) => {
      this.datacenter = d;
      this._isDatacenterLoaded = true;
    });
  }

  loadSeedDatacenter(): void {
    this._datacenterService.getDataCenter(this._dcName).pipe(first()).subscribe((d) => {
      this.seedDatacenter = d;
      this._isSeedDatacenterLoaded = true;
    });
  }

  isInitialized(): boolean {
    return this._isClusterLoaded && this._isDatacenterLoaded && this._isSeedDatacenterLoaded && this._areNodesLoaded &&
        this._isNodeDeploymentLoaded && this._areNodesEventsLoaded;
  }

  getProjectID(): string {
    return this._projectService.project.id;
  }

  goBackToCluster(): void {
    this._router.navigate(
        ['/projects/' + this._projectService.project.id + '/dc/' + this._dcName + '/clusters/' + this._clusterName]);
  }

  isEditEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].nodeDeployments.edit;
  }

  showEditDialog(): void {
    this._nodeService
        .showNodeDeploymentEditDialog(
            this.nodeDeployment, this.cluster, this._projectService.project.id, this.seedDatacenter, undefined)
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.loadNodeDeployment();
            this.loadNodes();
          }
        });
  }

  isDeleteEnabled(): boolean {
    return !this._projectService.userGroup ||
        this._projectService.userGroupConfig[this._projectService.userGroup].nodeDeployments.delete;
  }

  showDeleteDialog(): void {
    this._nodeService
        .showNodeDeploymentDeleteDialog(
            this.nodeDeployment, this.cluster.id, this._projectService.project.id, this.seedDatacenter.metadata.name,
            undefined)
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.goBackToCluster();
          }
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
