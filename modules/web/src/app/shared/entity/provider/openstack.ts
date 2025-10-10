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

export interface OpenstackFlavor {
  disk: number;
  isPublic: boolean;
  memory: number;
  region: string;
  slug: string;
  swap: number;
  vcpus: number;
}

export class OpenstackTenant {
  id: string;
  name: string;
}

export class OpenstackNetwork {
  id: string;
  name: string;
  external: boolean;
}

export class OpenstackFloatingIPPool {
  id: string;
  name: string;
  external: boolean;
}

export class OpenstackSubnet {
  id: string;
  name: string;
  ipVersion: number;
}

export class OpenstackSecurityGroup {
  id: string;
  name: string;
}

export class OpenstackServerGroup {
  id: string;
  name: string;
}

export class OpenstackOptionalFields {
  length: number;
  name: string;
}

export class OpenstackAvailabilityZone {
  name: string;
}

export class OpenstackSubnetPool {
  id: string;
  name: string;
  ipVersion: number;
  isDefault: boolean;
  prefixes?: string[];
}

export class OpenstackLBClassConfig {
  floatingNetworkID?: string;
  floatingSubnetID?: string;
  floatingSubnetName?: string;
  floatingSubnetTags?: string;
  networkID?: string;
  subnetID?: string;
  memberSubnetID?: string;
}

export class OpenstackLoadBalancerClass {
  name: string;
  config: OpenstackLBClassConfig;
}
