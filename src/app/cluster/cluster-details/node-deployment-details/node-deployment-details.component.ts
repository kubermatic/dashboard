import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  areNodesLoaded = false;
  cluster: ClusterEntity;
  dc: DataCenterEntity;
  projectID: string;
  userGroup: string;
  userGroupConfig: UserGroupConfig;

  private _clusterName: string;
  private _dcName: string;
  private _nodeDeploymentID: string;
  private _unsubscribe: Subject<any> = new Subject();

  constructor(
      private _route: ActivatedRoute, private _api: ApiService, private appConfigService: AppConfigService,
      private userService: UserService, private dcService: DatacenterService) {}

  ngOnInit(): void {
    this._clusterName = this._route.snapshot.paramMap.get('clusterName');
    this._dcName = this._route.snapshot.paramMap.get('seedDc');
    this._nodeDeploymentID = this._route.snapshot.paramMap.get('nodeDeploymentID');
    this.projectID = this._route.snapshot.paramMap.get('projectID');

    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.userService.currentUserGroup(this.projectID).pipe(takeUntil(this._unsubscribe)).subscribe((group) => {
      this.userGroup = group;
    });

    this.loadNodeDeployment();
    this.loadNodes();

    this._api.getCluster(this._clusterName, this._dcName, this.projectID).toPromise().then((c) => {
      this.cluster = c;

      this.dcService.getDataCenter(this.cluster.spec.cloud.dc).toPromise().then((d) => {
        this.dc = d;
      });
    });

    // TODO edit button at top
    // TODO del button...
    // TODO status icon
    // TODO 10s interval
    // TODO unsubscribe others
    // TODO fix breadcrumb
    // TODO fix api call in console
  }

  loadNodeDeployment(): void {
    this._api.getNodeDeployment(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((nd) => {
          this.nodeDeployment = nd;
        });
  }

  loadNodes(): void {
    this._api.getNodeDeploymentNodes(this._nodeDeploymentID, this._clusterName, this._dcName, this.projectID)
        .subscribe((nodes) => {
          this.nodes = nodes;
          this.areNodesLoaded = true;
        });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
