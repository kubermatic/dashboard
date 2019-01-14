import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiService} from '../../../core/services';
import {NodeEntity} from '../../../shared/entity/NodeEntity';


@Component({
  selector: 'kubermatic-cluster-details',
  templateUrl: './node-deployment-details.component.html',
  styleUrls: ['./node-deployment-details.component.scss'],
})

export class NodeDeploymentDetailsComponent implements OnInit, OnDestroy {
  nodes: NodeEntity[] = [];

  private _clusterName: string;
  private _seedDatacenterName: string;
  private _projectID: string;
  private _nodeDeploymentID: string;

  constructor(private _route: ActivatedRoute, private _api: ApiService) {}

  ngOnInit(): void {
    this._clusterName = this._route.snapshot.paramMap.get('clusterName');
    this._seedDatacenterName = this._route.snapshot.paramMap.get('seedDc');
    this._projectID = this._route.snapshot.paramMap.get('projectID');
    this._nodeDeploymentID = this._route.snapshot.paramMap.get('nodeDeploymentID');

    this._api
        .getNodeDeploymentNodes(this._nodeDeploymentID, this._clusterName, this._seedDatacenterName, this._projectID)
        .subscribe((nodes) => {
          this.nodes = nodes;
        });

    // TODO 10s interval
    // TODO unsubscribe
    // TODO fix breadcrumb
    // TODO fix api call in console
  }

  ngOnDestroy(): void {}
}
