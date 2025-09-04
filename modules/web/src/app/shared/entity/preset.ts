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

import {Metadata} from '@shared/entity/common';
import {NodeProvider, NodeProviderConstants} from '@shared/model/NodeProviderConstants';
import _ from 'lodash';

export class SimplePresetList {
  names: string[] = [];

  constructor(...names: string[]) {
    this.names = names;
  }
}

export class PresetList {
  items: Preset[];
}

export class PresetStat {
  associatedClusters: number;
  associatedClusterTemplates: number;
}

export class PresetLinkages {
  presetName: string;
  clusters: ClusterAssociation[];
  clusterTemplates: ClusterTemplateAssociation[];
}

export class ClusterAssociation {
  clusterId: string;
  clusterName: string;
  projectId: string;
  projectName: string;
  provider: string;
}

export class ClusterTemplateAssociation {
  templateId: string;
  templateName: string;
  projectId: string;
  projectName: string;
  provider: string;
}

export class Preset {
  name: string;
  enabled: boolean;
  providers: PresetProvider[];
  associatedClusters?: number;
  associatedClusterTemplates?: number;
}

export class PresetProvider {
  name: NodeProvider;
  enabled: boolean;
  isCustomizable: boolean;

  // Provider specific fields
  openstack?: OpenstackAPIPreset;
  vmwareCloudDirector?: VMwareCloudDirectorAPIPreset;
}

export class OpenstackAPIPreset {
  network?: string;
  securityGroups?: string;
  floatingIPPool?: string;
  routerID?: string;
  subnetID?: string;
}

export class VMwareCloudDirectorAPIPreset {
  ovdcNetwork?: string;
  ovdcNetworks?: string[];
}

export class UpdatePresetStatusReq {
  enabled: boolean;
}

export class PresetModel {
  metadata: Metadata;
  spec: CreatePresetSpec;

  constructor() {
    this.metadata = new Metadata();
    this.spec = new CreatePresetSpec();
  }
}

export class CreatePresetSpec {
  aks?: AKSPresetSpec;
  alibaba?: AlibabaPresetSpec;
  anexia?: AnexiaPresetSpec;
  aws?: AWSPresetSpec;
  azure?: AzurePresetSpec;
  digitalocean?: DigitaloceanPresetSpec;
  eks?: EKSPresetSpec;
  gcp?: GCPPresetSpec;
  gke?: GKEPresetSpec;
  hetzner?: HetznerPresetSpec;
  kubevirt?: KubevirtPresetSpec;
  nutanix?: NutanixPresetSpec;
  openstack?: OpenstackPresetSpec;
  vsphere?: VSpherePresetSpec;
  vmwareclouddirector?: VMwareCloudDirectorPresetSpec;
  baremetal?: BaremetalPresetSpec;

  requiredEmails?: string[];
  projects?: string[];
  enabled?: boolean;

  provider(): NodeProvider {
    const providerKey = Object.keys(this).find(
      key => !_.isEmpty(this[key]) && _.isObject(this[key]) && !_.isArray(this[key])
    );

    return providerKey ? NodeProviderConstants.newNodeProvider(providerKey) : NodeProvider.NONE;
  }
}

export class PresetProviderSpec {
  enabled?: boolean;
  datacenter?: string;
  isCustomizable?: boolean;
}

export class AlibabaPresetSpec extends PresetProviderSpec {
  accessKeyID: string;
  accessKeySecret: string;
}

export class AnexiaPresetSpec extends PresetProviderSpec {
  token: string;
}

export class AWSPresetSpec extends PresetProviderSpec {
  accessKeyID: string;
  secretAccessKey: string;

  vpcID?: string;
  routeTableID?: string;
  instanceProfileName?: string;
  securityGroupID?: string;
  roleARN?: string;
}

export class EKSPresetSpec extends PresetProviderSpec {
  accessKeyID: string;
  secretAccessKey: string;
  region: string;
}

export class AzurePresetSpec extends PresetProviderSpec {
  tenantID: string;
  subscriptionID: string;
  clientID: string;
  clientSecret: string;

  resourceGroup?: string;
  vnet?: string;
  subnet?: string;
  routeTable?: string;
  securityGroup?: string;
  loadBalancerSKU?: string;
}

export class AKSPresetSpec extends PresetProviderSpec {
  tenantID: string;
  subscriptionID: string;
  clientID: string;
  clientSecret: string;
}

export class DigitaloceanPresetSpec extends PresetProviderSpec {
  token: string;
}

export class GCPPresetSpec extends PresetProviderSpec {
  serviceAccount: string;

  network?: string;
  subnetwork?: string;
}

export class GKEPresetSpec extends PresetProviderSpec {
  serviceAccount: string;
}

export class HetznerPresetSpec extends PresetProviderSpec {
  token: string;
}

export class KubevirtPresetSpec extends PresetProviderSpec {
  kubeconfig: string;
  vpcName?: string;
}

export class NutanixPresetSpec extends PresetProviderSpec {
  proxyURL: string;
  username: string;
  password: string;

  clusterName?: string;
  projectName?: string;

  csiUsername?: string;
  csiPassword?: string;
  csiEndpoint?: string;
  csiPort?: string;
}

export class OpenstackPresetSpec extends PresetProviderSpec {
  username?: string;
  password?: string;
  project?: string;
  projectID?: string;

  applicationCredentialID?: string;
  applicationCredentialSecret?: string;

  domain: string;
  network?: string;
  securityGroups?: string;
  floatingIPPool?: string;
  routerID?: string;
  subnetID?: string;
}
export class VSpherePresetSpec extends PresetProviderSpec {
  username: string;
  password: string;

  vmNetName?: string;
  networks?: string[];
  datastore?: string;
  datastoreCluster?: string;
  resourcePool?: string;
  basePath?: string;
}

export class VMwareCloudDirectorPresetSpec extends PresetProviderSpec {
  username: string;
  password: string;

  organization: string;
  vdc: string;
  ovdcNetwork?: string;
  ovdcNetworks?: string[];
}

export class BaremetalPresetSpec extends PresetProviderSpec {
  tinkerbell: BaremetalTinkerbellPresetSpec;
}

export class BaremetalTinkerbellPresetSpec {
  kubeconfig: string;
}
