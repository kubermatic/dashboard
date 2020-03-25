import {Inject, Injectable} from '@angular/core';
import * as _ from 'lodash';
import {ReplaySubject} from 'rxjs';
import {DatacenterService, PresetsService} from '../../core/services';
import {OperatingSystemSpec, Taint} from '../../shared/entity/NodeEntity';
import {OperatingSystem} from '../../shared/model/NodeProviderConstants';
import {NodeData} from '../../shared/model/NodeSpecChange';
import {ClusterService} from '../../wizard-new/service/cluster';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '../config';
import {NodeDataAWSProvider} from './provider/aws';
import {NodeDataDigitalOceanProvider} from './provider/digitalocean';
import {NodeDataHetznerProvider} from './provider/hetzner';
import {NodeDataPacketProvider} from './provider/packet';

@Injectable()
export class NodeDataService {
  private readonly _config: NodeDataConfig;
  private _nodeData: NodeData = NodeData.NewEmptyNodeData();

  readonly nodeDataChanges = new ReplaySubject<NodeData>();
  readonly operatingSystemChanges = new ReplaySubject<OperatingSystem>();

  constructor(
      @Inject(NODE_DATA_CONFIG) config: NodeDataConfig, private readonly _presetService: PresetsService,
      private readonly _datacenterService: DatacenterService, private readonly _clusterService: ClusterService) {
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

  set operatingSystemSpec(spec: OperatingSystemSpec) {
    delete this._nodeData.spec.operatingSystem;
    this._nodeData.spec.operatingSystem = spec;
    this.operatingSystemChanges.next(OperatingSystemSpec.getOperatingSystem(spec));
  }

  get operatingSystemSpec(): OperatingSystemSpec {
    return this._nodeData.spec.operatingSystem;
  }

  get operatingSystem(): OperatingSystem {
    return OperatingSystemSpec.getOperatingSystem(this._nodeData.spec.operatingSystem);
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

  readonly aws = new NodeDataAWSProvider(this, this._clusterService, this._presetService, this._datacenterService);
  readonly digitalOcean = new NodeDataDigitalOceanProvider(this, this._clusterService, this._presetService);
  readonly hetzner = new NodeDataHetznerProvider(this, this._clusterService, this._presetService);
  readonly packet = new NodeDataPacketProvider(this, this._clusterService, this._presetService);
}
