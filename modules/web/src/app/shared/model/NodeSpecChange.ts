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

import {NodeCloudSpec, NodeSpec, OperatingSystemSpec} from '../entity/node';

export class NodeData {
  annotations?: Record<string, string>;
  operatingSystemProfile?: string;
  name?: string;
  spec?: NodeSpec;
  count?: number;
  valid?: boolean;
  dynamicConfig?: boolean;
  enableClusterAutoscalingApp?: boolean; // This field is used in the UI only
  maxReplicas?: number;
  minReplicas?: number;
  creationTimestamp?: Date;

  static NewEmptyNodeData(): NodeData {
    return {
      spec: {
        operatingSystem: {} as OperatingSystemSpec,
        cloud: {} as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
