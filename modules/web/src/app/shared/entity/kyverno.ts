// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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

export enum Visibilities {
  Global = 'global',
  Project = 'project',
  Cluster = 'cluster',
}

export class PolicyTemplate {
  name: string;
  spec: PolicyTemplateSpec;
}

export class PolicyTemplateSpec {
  title: string;
  description: string;
  category?: string;
  severity?: string;
  visibility: 'global' | 'project' | 'cluster';
  projectID?: string;
  default?: boolean;
  enforced: boolean;
  policySpec: object;
}

export class PolicyBinding {
  name: string;
  namespace: string;
  spec: PolicyBindingSpec;
  projectID?: string;
  status?: object;
}

export class PolicyBindingSpec {
  policyTemplateRef: PolicyTemplateRef;
  namespacedPolicy: boolean;
  scope: 'global' | 'project' | 'cluster';
  target: PolicyTargetSpec;
}

export class PolicyTemplateRef {
  name: string;
  [key: string]: any
}

export class PolicyTargetSpec {
  projects: ResourceSelector;
  clusters: ResourceSelector;
}

export class ResourceSelector {
  name?: string[];
  selectAll?: boolean;
}
