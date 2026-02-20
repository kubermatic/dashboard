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
import {NodeDataBaremetalProvider} from '@core/services/node-data/provider/baremetal';
import {NodeDataKubeVirtProvider} from '@core/services/node-data/provider/kubevirt';
import {NodeDataVMwareCloudDirectorProvider} from '@core/services/node-data/provider/vmware-cloud-director';
import {NodeDataVSphereProvider} from '@core/services/node-data/provider/vsphere';
import {ProjectService} from '@core/services/project';
import {AlibabaService} from '@core/services/provider/alibaba';
import {AnexiaService} from '@core/services/provider/anexia';
import {AWSService} from '@core/services/provider/aws';
import {AzureService} from '@core/services/provider/azure';
import {BaremetalService} from '@core/services/provider/baremetal';
import {DigitalOceanService} from '@core/services/provider/digitalocean';

import {GCPService} from '@core/services/provider/gcp';
import {HetznerService} from '@core/services/provider/hetzner';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {NutanixService} from '@core/services/provider/nutanix';
import {OpenStackService} from '@core/services/provider/openstack';
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {VSphereService} from '@core/services/provider/vsphere';
import {PresetsService} from '@core/services/wizard/presets';
import {MachineDeployment, OPERATING_SYSTEM_PROFILE_ANNOTATION} from '@shared/entity/machine-deployment';
import {NodeNetworkSpec, OperatingSystemSpec, Taint} from '@shared/entity/node';
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
import {NodeDataNutanixProvider} from './provider/nutanix';
import {NodeDataOpenstackProvider} from './provider/openstack';

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

    private readonly _gcpService: GCPService,
    private readonly _hetznerService: HetznerService,
    private readonly _nutanixService: NutanixService,
    private readonly _openStackService: OpenStackService,
    private readonly _vmwareCloudDirectorService: VMwareCloudDirectorService,
    private readonly _vsphereService: VSphereService,
    private readonly _projectService: ProjectService,
    private readonly _baremetalService: BaremetalService
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

  set network(spec: NodeNetworkSpec) {
    delete this._nodeData.spec.network;
    this._nodeData.spec.network = spec;
  }

  get network(): NodeNetworkSpec {
    return this._nodeData.spec.network;
  }

  get operatingSystem(): OperatingSystem {
    return OperatingSystemSpec.getOperatingSystem(this._nodeData.spec.operatingSystem);
  }

  set labels(labels: Record<string, string>) {
    delete this._nodeData.spec.labels;
    this._nodeData.spec.labels = labels;
  }

  set machineDeploymentLabels(labels: Record<string, string>) {
    delete this._nodeData.labels;
    this._nodeData.labels = labels;
  }

  set annotations(annotations: Record<string, string>) {
    delete this._nodeData.spec.annotations;
    this._nodeData.spec.annotations = annotations;
  }

  set machineDeploymentAnnotations(annotations: Record<string, string>) {
    delete this._nodeData.annotations;
    this._nodeData.annotations = annotations;
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
      annotations: md.annotations,
      labels: md.labels,
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
  readonly vsphere = new NodeDataVSphereProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._projectService,
    this._vsphereService
  );
  readonly vmwareclouddirector = new NodeDataVMwareCloudDirectorProvider(
    this,
    this._clusterSpecService,
    this._presetService,
    this._projectService,
    this._vmwareCloudDirectorService
  );

  readonly baremetal = new NodeDataBaremetalProvider(
    this,
    this._baremetalService,
    this._clusterSpecService,
    this._projectService
  );
}
