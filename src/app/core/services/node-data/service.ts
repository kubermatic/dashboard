// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Inject, Injectable} from '@angular/core';
import {NODE_DATA_CONFIG, NodeDataConfig, NodeDataMode} from '@app/node-data/config';
import {ApiService} from '@core/services/api';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {OperatingSystemSpec, Taint} from '@shared/entity/node';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import * as _ from 'lodash';
import {ReplaySubject} from 'rxjs';
import {NodeDataAlibabaProvider} from './provider/alibaba';
import {NodeDataAnexiaProvider} from './provider/anexia';
import {NodeDataAWSProvider} from './provider/aws';
import {NodeDataAzureProvider} from './provider/azure';
import {NodeDataDigitalOceanProvider} from './provider/digitalocean';
import {NodeDataGCPProvider} from './provider/gcp';
import {NodeDataHetznerProvider} from './provider/hetzner';
import {NodeDataOpenstackProvider} from './provider/openstack';
import {NodeDataEquinixProvider} from './provider/equinix';

@Injectable()
export class NodeDataService {
  private readonly _config: NodeDataConfig;
  private _nodeData: NodeData = NodeData.NewEmptyNodeData();
  private _operatingSystemChanges = new ReplaySubject<OperatingSystem>();

  readonly nodeDataChanges = new ReplaySubject<NodeData>();

  constructor(
    @Inject(NODE_DATA_CONFIG) config: NodeDataConfig,
    private readonly _presetService: PresetsService,
    private readonly _datacenterService: DatacenterService,
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _apiService: ApiService,
    private readonly _projectService: ProjectService
  ) {
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

  get operatingSystemChanges(): ReplaySubject<OperatingSystem> {
    return this._operatingSystemChanges;
  }

  set operatingSystemSpec(spec: OperatingSystemSpec) {
    delete this._nodeData.spec.operatingSystem;
    this._nodeData.spec.operatingSystem = spec;
    this._operatingSystemChanges.next(OperatingSystemSpec.getOperatingSystem(spec));
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

  isInWizardMode(): boolean {
    return this.mode === NodeDataMode.Wizard;
  }

  reset(): void {
    this._nodeData = NodeData.NewEmptyNodeData();
    this._operatingSystemChanges = new ReplaySubject<OperatingSystem>();
  }

  readonly alibaba = new NodeDataAlibabaProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._datacenterService,
    this._apiService,
    this._projectService
  );
  readonly anexia = new NodeDataAnexiaProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._datacenterService,
    this._apiService,
    this._projectService
  );
  readonly aws = new NodeDataAWSProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService,
    this._datacenterService
  );
  readonly azure = new NodeDataAzureProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService,
    this._datacenterService
  );
  readonly digitalOcean = new NodeDataDigitalOceanProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService
  );
  readonly hetzner = new NodeDataHetznerProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService
  );
  readonly equinix = new NodeDataEquinixProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService
  );
  readonly gcp = new NodeDataGCPProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService
  );
  readonly openstack = new NodeDataOpenstackProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._apiService,
    this._projectService
  );
}
