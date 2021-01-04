// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Metadata} from '@shared/entity/common';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

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
  providers: NodeProvider[];
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
  alibaba?: AlibabaPresetSpec;
  anexia?: AnexiaPresetSpec;
  aws?: AWSPresetSpec;
  azure?: AzurePresetSpec;
  digitalocean?: DigitaloceanPresetSpec;
  gcp?: GCPPresetSpec;
  hetzner?: HetznerPresetSpec;
  kubevirt?: KubevirtPresetSpec;
  openstack?: OpenstackPresetSpec;
  packet?: PacketPresetSpec;
  vsphere?: VSpherePresetSpec;

  requiredEmailDomain?: string;
  enabled?: boolean;
}

export class PresetProvider {
  enabled?: boolean;
  datacenter?: string;
}

export class AlibabaPresetSpec extends PresetProvider {
  accessKeyId: string;
  accessKeySecret: string;
}

export class AnexiaPresetSpec extends PresetProvider {
  token: string;
}

export class AWSPresetSpec extends PresetProvider {
  accessKeyID: string;
  secretAccessKey: string;

  vpcID?: string;
  routeTableID?: string;
  instanceProfileName?: string;
  securityGroupID?: string;
  roleARN?: string;
}

export class AzurePresetSpec extends PresetProvider {
  tenantID: string;
  subscriptionID: string;
  clientID: string;
  clientSecret: string;

  resourceGroup?: string;
  vnet?: string;
  subnet?: string;
  routeTable?: string;
  securityGroup?: string;
}

export class DigitaloceanPresetSpec extends PresetProvider {
  token: string;
}

export class GCPPresetSpec extends PresetProvider {
  serviceAccount: string;

  network?: string;
  subnetwork?: string;
}

export class HetznerPresetSpec extends PresetProvider {
  token: string;
}

export class KubevirtPresetSpec extends PresetProvider {
  kubeconfig: string;
}

export class OpenstackPresetSpec extends PresetProvider {
  username: string;
  password: string;
  tenant: string;
  tenantID: string;
  domain: string;

  network?: string;
  securityGroups?: string;
  floatingIpPool?: string;
  routerID?: string;
  subnetID?: string;
}

export class PacketPresetSpec extends PresetProvider {
  apiKey: string;
  projectID: string;

  billingCycle?: string;
}

export class VSpherePresetSpec extends PresetProvider {
  username: string;
  password: string;

  vmNetName?: string;
  datastore?: string;
  datastoreCluster?: string;
}
