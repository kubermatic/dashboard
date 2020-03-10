import {Inject, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {Observable, ReplaySubject} from 'rxjs';
import {filter, switchMap} from 'rxjs/operators';
import {DatacenterService, PresetsService} from '../../core/services';
import {OperatingSystemSpec, Taint} from '../../shared/entity/NodeEntity';
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

  set operatingSystem(spec: OperatingSystemSpec) {
    delete this._nodeData.spec.operatingSystem;
    this._nodeData.spec.operatingSystem = spec;
  }

  set labels(labels: object) {
    delete this._nodeData.spec.labels;
    this._nodeData.spec.labels = labels;
  }

  set taints(taints: Taint[]) {
    delete this._nodeData.spec.taints;
    this._nodeData.spec.taints = taints;
  }

  isInDialogEditMode(): boolean {
    // In dialog edit mode node will always have a name
    return this.mode === NodeDataMode.Dialog && !!this._nodeData.name;
  }

  isInWizardMode(): boolean {
    return this.mode === NodeDataMode.Wizard;
  }

  readonly aws = new class {
    constructor(private _parent: NodeDataService) {}

    set tags(tags: object) {
      delete this._parent._nodeData.spec.cloud.aws.tags;
      this._parent._nodeData.spec.cloud.aws.tags = tags;
    }

    flavors(): Observable<AWSSize[]> {
      // TODO: support dialog mode
      switch (this._parent.mode) {
        case NodeDataMode.Wizard:
          return this._parent._clusterService.datacenterChanges
              .pipe(switchMap(dc => this._parent._datacenter.getDataCenter(dc)))
              .pipe(switchMap(
                  dc => this._parent._preset.provider(NodeProvider.AWS).region(dc.spec.aws.region).flavors()));
      }
    }

    subnets(): Observable<AWSSubnet[]> {
      // TODO: support dialog mode
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
      }
    }
  }
  (this);
}
