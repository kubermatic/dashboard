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

export class AWSSubnet {
  name: string;
  id: string;
  availability_zone: string;
  availability_zone_id: string;
  ipv4cidr: string;
  ipv6cidr: string;
  tags: AWSTags[];
  state: string;
  available_ip_address_count: number;
  default: boolean;
  isDefaultSubnet?: boolean;
}

export class AWSTags {
  key: string;
  value: string;
}

export class AWSVPC {
  vpcId: string;
  name: string;
  cidrBlock: string;
  cidrBlockAssociationSet: AWSCidrBlockSet[];
  dhcpOptionsId: string;
  instanceTenancy: string;
  ipv6CidrBlockAssociationSet: AWSCidrBlockSet[];
  isDefault: boolean;
  ownerId: string;
  state: string;
  tags: AWSTags[];

  get displayName(): string {
    return this.name !== '' ? `${this.name} (${this.vpcId})` : this.vpcId;
  }
}

export class AWSSecurityGroups {
  ids: string[];
}

export class AWSCidrBlockSet {
  associationId: string;
  cidrBlock: string;
  state: string;
  statusMessage: string;
}

export class AWSSize {
  name: string;
  pretty_name: string;
  architecture: Architecture;
  memory: number;
  vcpus: number;
  price: number;
  gpus: number;
}

export enum Architecture {
  ARM64 = 'arm64',
  X64 = 'x64',
  X86_64 = 'x86_64',
}
