import {Inject, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {Observable, ReplaySubject} from 'rxjs';
import {filter, switchMap} from 'rxjs/operators';
import {DatacenterService, PresetsService} from '../../core/services';
import {AWSSize, AWSSubnet} from '../../shared/entity/provider/aws/AWS';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {ClusterService} from '../../wizard-new/service/cluster';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../config';

@Injectable()
export class NodeDataService {
  private readonly _config: NodeDataConfig;
  private _nodeData: NodeData = NodeData.NewEmptyNodeData();

  readonly nodeDataChanges = new ReplaySubject<NodeData>();

  constructor(
      @Inject(NODE_DATA_CONFIG) config: NodeDataConfig, private readonly _preset: PresetsService,
      private readonly _datacenter: DatacenterService, private readonly _clusterService: ClusterService) {
    this._config = config;
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

  readonly aws = new class {
    constructor(private _parent: NodeDataService) {}

    flavors(): Observable<AWSSize[]> {
      switch (this._parent.mode) {
        case NodeDataMode.Wizard:
          return this._parent._clusterService.datacenterChanges
              .pipe(switchMap(dc => this._parent._datacenter.getDataCenter(dc)))
              .pipe(switchMap(
                  dc => this._parent._preset.provider(NodeProvider.AWS).region(dc.spec.aws.region).flavors()));
          // case NodeDataMode.Dialog:
          //   return this._project.selectedProject.pipe(
          //       switchMap(project => this._api.getAWSSizes(project.id, this.seedDatacenterName, this.clusterID)));
      }
    }

    subnets(): Observable<AWSSubnet[]> {
      switch (this._parent.mode) {
        case NodeDataMode.Wizard:
          return this._parent._clusterService.clusterChanges
              .pipe(filter(_ => this._parent._clusterService.provider === NodeProvider.AWS))
              .pipe(switchMap(
                  cluster => this._parent._preset.provider(NodeProvider.AWS)
                                 .accessKeyID(cluster.spec.cloud.aws.accessKeyId)
                                 .secretAccessKey(cluster.spec.cloud.aws.secretAccessKey)
                                 .vpc(cluster.spec.cloud.aws.vpcId)
                                 .credential(this._parent._preset.preset)
                                 .subnets(cluster.spec.cloud.dc)));
          //   case NodeDataMode.Dialog:
          //     return this._project.selectedProject.pipe(
          //         switchMap(project => this._api.getAWSSubnets(project.id, this.seedDatacenterName,
          //         this.clusterID)));
          // }
      }
    }
  }
  (this);
}
