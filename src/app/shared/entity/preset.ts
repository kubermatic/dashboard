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

export class Preset {
  name: string;
  enabled: boolean;
  providers: PresetProvider[];
}

export class PresetProvider {
  name: NodeProvider;
  enabled: boolean;
}

export class UpdatePresetStatusReq {
  enabled: boolean;
}

export class CreatePresetReq {
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
  openstack?: OpenstackPresetSpec;
  packet?: EquinixPresetSpec;
  vsphere?: VSpherePresetSpec;

  requiredEmailDomain?: string;
  enabled?: boolean;

  provider(): NodeProvider {
    const providerKey = Object.keys(this).find(key => !_.isEmpty(this[key]) && _.isObject(this[key]));
    return providerKey ? NodeProviderConstants.newNodeProvider(providerKey) : NodeProvider.NONE;
  }
}

export class PresetProviderSpec {
  enabled?: boolean;
  datacenter?: string;
}

export class AlibabaPresetSpec extends PresetProviderSpec {
  accessKeyId: string;
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
}

export class OpenstackPresetSpec extends PresetProviderSpec {
  username: string;
  password: string;
  project: string;
  projectID: string;
  domain: string;

  network?: string;
  securityGroups?: string;
  floatingIpPool?: string;
  routerID?: string;
  subnetID?: string;
}

export class EquinixPresetSpec extends PresetProviderSpec {
  apiKey: string;
  projectID: string;

  billingCycle?: string;
}

export class VSpherePresetSpec extends PresetProviderSpec {
  username: string;
  password: string;

  vmNetName?: string;
  datastore?: string;
  datastoreCluster?: string;
  resourcePool?: string;
}
