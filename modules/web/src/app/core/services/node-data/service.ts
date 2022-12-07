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
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataVMwareCloudDirectorProvider} from '@core/services/node-data/provider/vmware-cloud-director';
import {ProjectService} from '@core/services/project';
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {PresetsService} from '@core/services/wizard/presets';
import {OperatingSystemSpec, Taint} from '@shared/entity/node';
import {OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import _ from 'lodash';
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
import {AWSService} from '@core/services/provider/aws';
import {AlibabaService} from '@core/services/provider/alibaba';
import {AnexiaService} from '@core/services/provider/anexia';
import {AzureService} from '@core/services/provider/azure';
import {DigitalOceanService} from '@core/services/provider/digitalocean';
import {EquinixService} from '@core/services/provider/equinix';
import {GCPService} from '@core/services/provider/gcp';
import {HetznerService} from '@core/services/provider/hetzner';
import {OpenStackService} from '@core/services/provider/openstack';
import {NodeDataNutanixProvider} from './provider/nutanix';
import {NutanixService} from '@core/services/provider/nutanix';
import {NodeDataVSphereProvider} from '@core/services/node-data/provider/vsphere';
import {NodeDataKubeVirtProvider} from '@core/services/node-data/provider/kubevirt';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {MachineDeployment, OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';

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
    private readonly _alibabaService: AlibabaService,
    private readonly _anexiaService: AnexiaService,
    private readonly _awsService: AWSService,
    private readonly _azureService: AzureService,
    private readonly _digitalOceanService: DigitalOceanService,
    private readonly _kubeVirtService: KubeVirtService,
    private readonly _equinixService: EquinixService,
    private readonly _gcpService: GCPService,
    private readonly _hetznerService: HetznerService,
    private readonly _nutanixService: NutanixService,
    private readonly _openStackService: OpenStackService,
    private readonly _vmwareCloudDirectorService: VMwareCloudDirectorService,
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

  initializeNodeDataFromMachineDeployment(md: MachineDeployment): void {
    this.nodeData = {
      operatingSystemProfile: md.annotations?.[OPERATING_SYSTEM_PROFILE_ANNOTATION],
      count: md.spec.replicas,
      name: md.name,
      spec: md.spec.template,
      dynamicConfig: md.spec.dynamicConfig,
      minReplicas: md.spec.minReplicas,
      maxReplicas: md.spec.maxReplicas,
    } as NodeData;
  }

  readonly alibaba = new NodeDataAlibabaProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._datacenterService,
    this._alibabaService,
    this._projectService
  );
  readonly anexia = new NodeDataAnexiaProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._datacenterService,
    this._anexiaService,
    this._projectService
  );
  readonly aws = new NodeDataAWSProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._awsService,
    this._projectService,
    this._datacenterService
  );
  readonly azure = new NodeDataAzureProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._azureService,
    this._projectService,
    this._datacenterService
  );
  readonly digitalOcean = new NodeDataDigitalOceanProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._digitalOceanService,
    this._projectService
  );
  readonly kubeVirt = new NodeDataKubeVirtProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._kubeVirtService,
    this._projectService
  );
  readonly hetzner = new NodeDataHetznerProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._hetznerService,
    this._projectService
  );
  readonly nutanix = new NodeDataNutanixProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._nutanixService,
    this._projectService
  );
  readonly equinix = new NodeDataEquinixProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._equinixService,
    this._projectService
  );
  readonly gcp = new NodeDataGCPProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._gcpService,
    this._projectService
  );
  readonly openstack = new NodeDataOpenstackProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._openStackService,
    this._projectService
  );
  readonly vsphere = new NodeDataVSphereProvider(this);
  readonly vmwareclouddirector = new NodeDataVMwareCloudDirectorProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._projectService,
    this._vmwareCloudDirectorService
  );
}
