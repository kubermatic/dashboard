// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

export class EKSCluster {
  name: string;
  region: string;
  imported: boolean;
}

export class EKSCloudSpec {
  name: string;
  accessKeyID?: string;
  secretAccessKey?: string;
  region?: string;
}

export class EKSClusterSpec {
  roleArn: string;
  version?: string;
  vpcConfigRequest: {
    vpcId?: string;
    securityGroupIds: string[];
    subnetIds: string[];
  };
}

export interface EKSVpc {
  default: boolean;
  id: string;
}

export class EKSSubnet {
  availabilityZone: string;
  subnetId: string;
  vpcId: string;
  default: boolean;
}

export class EKSSecurityGroup {
  groupId: string;
  vpcId: string;
}

export class EKSClusterRole {
  arn: string;
  roleName: string;
}

export class EKSNodeRole {
  arn: string;
  roleName: string;
}

export class EKSInstanceType {
  name: string;
  pretty_name: string;
  vcpus: number;
  memory: number;
  architecture: string;
}

export enum EKSArchitecture {
  ARM64 = 'arm64',
  X86_64 = 'x86_64',
}
