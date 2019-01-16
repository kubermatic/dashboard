import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {interval, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, DatacenterService, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';
import {NodeDeploymentEntity} from '../../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {UserGroupConfig} from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './node-deployment-details.component.html',
  styleUrls: ['./node-deployment-details.component.scss'],
})
export class NodeDeploymentDetailsComponent implements OnInit, OnDestroy {
  nodeDeployment: NodeDeploymentEntity;
  nodes: NodeEntity[] = [];
  cluster: ClusterEntity;
  dc: DataCenterEntity;
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  private _clusterName: string;
  private _dcName: string;
  private _nodeDeploymentID: string;
  private _areNodesLoaded = false;
  private _isClusterLoaded = false;
  private _isDatacenterLoaded = false;
  private _refreshInterval = 10000;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private _route: ActivatedRoute, private _api: ApiService, private appConfigService: AppConfigService,
      private userService: UserService, private dcService: DatacenterService) {}

  ngOnInit(): void {
    this._clusterName = this._route.snapshot.paramMap.get('clusterName');
    this._dcName = this._route.snapshot.paramMap.get('seedDc');
    this._nodeDeploymentID = this._route.snapshot.paramMap.get('nodeDeploymentID');
    this.projectID = this._route.snapshot.paramMap.get('projectID');

    this.loadNodeDeployment();
    this.loadNodes();
    this.loadCluster();
    this.loadDatacenter();
    this.loadUserGroupData();

    interval(this._refreshInterval).pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this.loadNodeDeployment();
      this.loadNodes();
    });
  }

  loadNodeDeployment(): void {
    this._api.getNodeDeployment(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(first())
        .subscribe((nd) => {
          this.nodeDeployment = nd;
        });
  }

  loadNodes(): void {
    this._api.getNodeDeploymentNodes(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(first())
        .subscribe((nodes) => {
          this.nodes = nodes;
          this._areNodesLoaded = true;
        });
  }

  loadCluster(): void {
    this._api.getCluster(this._clusterName, this._dcName, this.projectID).pipe(first()).subscribe((c) => {
      this.cluster = c;
      this._isClusterLoaded = true;
    });
  }

  loadDatacenter(): void {
    this.dcService.getDataCenter(this._dcName).pipe(first()).subscribe((d) => {
      this.dc = d;
      this._isDatacenterLoaded = true;
    });
  }

  loadUserGroupData(): void {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).pipe(takeUntil(this._unsubscribe)).subscribe((ug) => {
      this.userGroup = ug;
    });
  }

  isInitialized(): boolean {
    return this._isClusterLoaded && this._isDatacenterLoaded && this._areNodesLoaded;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
