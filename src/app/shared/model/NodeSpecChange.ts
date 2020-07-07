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

import {
  CentosSpec,
  ContainerLinuxSpec,
  NodeCloudSpec,
  NodeSpec,
  RHELSpec,
  SLESSpec,
  UbuntuSpec,
  FlatcarSpec,
} from '../entity/node';

export class NodeData {
  name?: string;
  spec?: NodeSpec;
  count?: number;
  valid?: boolean;
  dynamicConfig?: boolean;

  static NewEmptyNodeData(): NodeData {
    return {
      spec: {
        operatingSystem: {
          ubuntu: {},
        },
        cloud: {} as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}

export class NodeProviderData {
  spec?: NodeCloudSpec;
  valid?: boolean;
}

export class NodeOperatingSystemData {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
  sles?: SLESSpec;
  rhel?: RHELSpec;
  flatcar?: FlatcarSpec;
}
