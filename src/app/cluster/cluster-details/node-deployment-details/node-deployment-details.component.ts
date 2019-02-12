import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {interval, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, DatacenterService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {UserGroupConfig} from '../../../shared/model/Config';
import {NodeDeploymentHealthStatus} from '../../../shared/utils/health-status/node-deployment-health-status';
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
  system: string;
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  private _clusterName: string;
  private _dcName: string;
  private _nodeDeploymentID: string;
  private _isNodeDeploymentLoaded = false;
  private _areNodesLoaded = false;
  private _areNodesEventsLoaded = false;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;
  private _refreshInterval = 10000;
  private _unsubscribe: Subject<any> = new Subject();

  private static _getClusterProvider(cluster: ClusterEntity): string {
    if (cluster.spec.cloud.aws) {
      return 'aws';
    } else if (cluster.spec.cloud.digitalocean) {
      return 'digitalocean';
    } else if (cluster.spec.cloud.openstack) {
      return 'openstack';
    } else if (cluster.spec.cloud.bringyourown) {
      return 'bringyourown';
    } else if (cluster.spec.cloud.hetzner) {
      return 'hetzner';
    } else if (cluster.spec.cloud.vsphere) {
      return 'vsphere';
    } else if (cluster.spec.cloud.azure) {
      return 'azure';
    }
  }

  constructor(
      private readonly _activatedRoute: ActivatedRoute, private readonly _router: Router,
      private readonly _apiService: ApiService, private readonly _appConfigService: AppConfigService,
      private readonly _userService: UserService, private readonly _datacenterService: DatacenterService,
      private readonly _nodeService: NodeService) {}

  ngOnInit(): void {
    this._clusterName = this._activatedRoute.snapshot.paramMap.get('clusterName');
    this._dcName = this._activatedRoute.snapshot.paramMap.get('seedDc');
    this._nodeDeploymentID = this._activatedRoute.snapshot.paramMap.get('nodeDeploymentID');
    this.projectID = this._activatedRoute.snapshot.paramMap.get('projectID');

    this.loadNodeDeployment();
    this.loadNodes();
    this.loadNodesEvents();
    this.loadCluster();
    this.loadDatacenter();
    this.loadUserGroupData();

    interval(this._refreshInterval).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.loadNodeDeployment();
      this.loadNodes();
      this.loadNodesEvents();
    });
  }

  loadNodeDeployment(): void {
    this._apiService.getNodeDeployment(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(first())
        .subscribe((nd) => {
          this.nodeDeployment = nd;
          this.system = NodeService.getOperatingSystem(this.nodeDeployment.spec.template);
          this.nodeDeploymentHealthStatus = NodeDeploymentHealthStatus.getHealthStatus(this.nodeDeployment);
          this._isNodeDeploymentLoaded = true;
        });
  }

  loadNodes(): void {
    this._apiService.getNodeDeploymentNodes(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(first())
        .subscribe((n) => {
          this.nodes = n;
          this._areNodesLoaded = true;
        });
  }

  loadNodesEvents(): void {
    this._apiService
        .getNodeDeploymentNodesEvents(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(first())
        .subscribe((e) => {
          this.events = e;
          this._areNodesEventsLoaded = true;
        });
  }

  loadCluster(): void {
    this._apiService.getCluster(this._clusterName, this._dcName, this.projectID).pipe(first()).subscribe((c) => {
      this.cluster = c;
      this.clusterProvider = NodeDeploymentDetailsComponent._getClusterProvider(this.cluster);
      this._isClusterLoaded = true;
    });
  }

  loadDatacenter(): void {
    this._datacenterService.getDataCenter(this._dcName).pipe(first()).subscribe((d) => {
      this.datacenter = d;
      this._isDatacenterLoaded = true;
    });
  }

  loadUserGroupData(): void {
    this.userGroupConfig = this._appConfigService.getUserGroupConfig();
    this._userService.currentUserGroup(this.projectID).pipe(takeUntil(this._unsubscribe)).subscribe((ug) => {
      this.userGroup = ug;
    });
  }

  isInitialized(): boolean {
    return this._isClusterLoaded && this._isDatacenterLoaded && this._areNodesLoaded && this._isNodeDeploymentLoaded &&
        this._areNodesEventsLoaded;
  }

  goBackToCluster(): void {
    this._router.navigate(['/projects/' + this.projectID + '/dc/' + this._dcName + '/clusters/' + this._clusterName]);
  }

  showEditDialog(): void {
    this._nodeService
        .showNodeDeploymentEditDialog(this.nodeDeployment, this.cluster, this.projectID, this.datacenter, undefined)
        .subscribe((isConfirmed) => {
          if (isConfirmed) {
            this.loadNodeDeployment();
            this.loadNodes();
          }
        });
  }

  showDeleteDialog(): void {
    this._nodeService
        .showNodeDeploymentDeleteDialog(
            this.nodeDeployment, this.cluster.id, this.projectID, this.datacenter.metadata.name, undefined)
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
