import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subject, timer} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';
import {AppConfigService} from '../../../app-config.service';

import {ApiService, ClusterService, DatacenterService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {GroupConfig} from '../../../shared/model/Config';
import {ButtonUtils} from '../../../shared/utils/button-utils/button-utils';
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
  dcName: string;
  projectID: string;
  private _nodeDeploymentID: string;
  private _isNodeDeploymentLoaded = false;
  private _areNodesLoaded = false;
  private _areNodesEventsLoaded = false;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;
  private _isSeedDatacenterLoaded = false;
  private _unsubscribe: Subject<any> = new Subject();
  private _clusterName: string;
  private _currentGroupConfig: GroupConfig;

  constructor(
      private readonly _activatedRoute: ActivatedRoute, private readonly _router: Router,
      private readonly _apiService: ApiService, private readonly _datacenterService: DatacenterService,
      private readonly _nodeService: NodeService, private readonly _appConfig: AppConfigService,
      private readonly _userService: UserService, private readonly _clusterService: ClusterService) {}

  ngOnInit(): void {
    this._clusterName = this._activatedRoute.snapshot.paramMap.get('clusterName');
    this.dcName = this._activatedRoute.snapshot.paramMap.get('seedDc');
    this._nodeDeploymentID = this._activatedRoute.snapshot.paramMap.get('nodeDeploymentID');
    this.projectID = this._activatedRoute.snapshot.paramMap.get('projectID');

    this._userService.currentUserGroup(this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(userGroup => this._currentGroupConfig = this._userService.userGroupConfig(userGroup));

    timer(0, 10 * this._appConfig.getRefreshTimeBase()).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.loadNodeDeployment();
      this.loadNodes();
      this.loadNodesEvents();
    });

    this.loadSeedDatacenter();
    this.loadCluster();
  }

  getButtonWrapperClass(isDisabled: boolean): string {
    return ButtonUtils.getButtonWrapperClass(isDisabled);
  }

  loadNodeDeployment(): void {
    this._apiService.getNodeDeployment(this._nodeDeploymentID, this._clusterName, this.dcName, this.projectID)
        .pipe(first())
        .subscribe((nd: NodeDeploymentEntity) => {
          this.nodeDeployment = nd;
          this.system = NodeUtils.getOperatingSystem(this.nodeDeployment.spec.template);
          this.nodeDeploymentHealthStatus = NodeDeploymentHealthStatus.getHealthStatus(this.nodeDeployment);
          this._isNodeDeploymentLoaded = true;
        });
  }

  loadNodes(): void {
    this._apiService.getNodeDeploymentNodes(this._nodeDeploymentID, this._clusterName, this.dcName, this.projectID)
        .pipe(first())
        .subscribe((n) => {
          this.nodes = n;
          this._areNodesLoaded = true;
        });
  }

  loadNodesEvents(): void {
    this._apiService
        .getNodeDeploymentNodesEvents(this._nodeDeploymentID, this._clusterName, this.dcName, this.projectID)
        .pipe(first())
        .subscribe((e) => {
          this.events = e;
          this._areNodesEventsLoaded = true;
        });
  }

  loadCluster(): void {
    this._clusterService.cluster(this.projectID, this._clusterName, this.dcName).pipe(first()).subscribe((c) => {
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
    this._datacenterService.getDataCenter(this.dcName).pipe(first()).subscribe((d) => {
      this.seedDatacenter = d;
      this._isSeedDatacenterLoaded = true;
    });
  }

  isInitialized(): boolean {
    return this._isClusterLoaded && this._isDatacenterLoaded && this._isSeedDatacenterLoaded && this._areNodesLoaded &&
        this._isNodeDeploymentLoaded && this._areNodesEventsLoaded;
  }

  getProjectID(): string {
    return this.projectID;
  }

  getVersionHeadline(type: string, isKubelet: boolean): string {
    return ClusterUtils.getVersionHeadline(type, isKubelet);
  }

  goBackToCluster(): void {
    this._router.navigate(['/projects/' + this.projectID + '/dc/' + this.dcName + '/clusters/' + this._clusterName]);
  }

  isEditEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.edit;
  }

  showEditDialog(): void {
    this._nodeService
        .showNodeDeploymentEditDialog(this.nodeDeployment, this.cluster, this.projectID, this.seedDatacenter, undefined)
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.loadNodeDeployment();
            this.loadNodes();
          }
        });
  }

  isDeleteEnabled(): boolean {
    return !this._currentGroupConfig || this._currentGroupConfig.nodeDeployments.delete;
  }

  showDeleteDialog(): void {
    this._nodeService
        .showNodeDeploymentDeleteDialog(
            this.nodeDeployment, this.cluster.id, this.projectID, this.seedDatacenter.metadata.name, undefined)
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
