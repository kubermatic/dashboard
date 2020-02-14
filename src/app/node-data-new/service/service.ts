import {Inject, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {ReplaySubject} from 'rxjs';

import {ClusterEntity} from '../../shared/entity/ClusterEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../config';

@Injectable()
export class NodeDataService {
  private readonly _config: NodeDataConfig;
  private _clusterEntity: ClusterEntity;
  private _nodeData: NodeData = NodeData.NewEmptyNodeData();

  readonly clusterEntityChanges = new ReplaySubject<ClusterEntity>();
  readonly nodeDataChanges = new ReplaySubject<NodeData>();

  constructor(@Inject(NODE_DATA_CONFIG) config: NodeDataConfig) {
    this._config = config;
  }

  set clusterEntity(entity: ClusterEntity) {
    this._clusterEntity = _.merge(this._clusterEntity, entity);
    this.clusterEntityChanges.next(this._clusterEntity);
  }

  get clusterEntity(): ClusterEntity {
    return this._clusterEntity;
  }

  set nodeData(data: NodeData) {
    this._nodeData = _.merge(this._nodeData, data);
    this.nodeDataChanges.next(this._nodeData);
  }

  get nodeData(): NodeData {
    return this._nodeData;
  }

  get mode(): NodeDataMode {
    return this._config.mode;
  }
}
