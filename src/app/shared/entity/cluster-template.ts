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

import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Cluster} from '@shared/entity/cluster';

export class ClusterTemplate {
  name: string;
  id?: string;
  projectID?: string;
  user?: string;
  scope: ClusterTemplateScope;
  cluster?: Cluster;
  nodeDeployment?: MachineDeployment;
  userSshKeys?: ClusterTemplateSSHKey[];
}

export class ClusterTemplateSSHKey {
  id: string;
  name: string;
}

export enum ClusterTemplateScope {
  Global = 'global',
  Project = 'project',
  User = 'user',
}

export class CreateTemplateInstances {
  replicas: number;
}
