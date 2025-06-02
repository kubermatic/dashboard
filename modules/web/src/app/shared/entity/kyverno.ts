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

export enum Scopes {
  Global = 'Global',
  Project = 'Project',
}

export class PolicyTemplate {
  name: string;
  spec: PolicyTemplateSpec;
}

export class PolicyTemplateSpec {
  title: string;
  description: string;
  category?: string;
  severity?: PolicySeverity;
  visibility: 'Global' | 'Project';
  projectID?: string;
  default?: boolean;
  enforced: boolean;
  namespacedPolicy?: boolean;
  target: PolicyTemplateTarget;
  policySpec: object;
}

export enum PolicySeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export class PolicyTemplateTarget {
  projectSelector: {
    matchLabels: object;
  };
  clusterSelector: {
    matchLabels: object;
  };
}
export class PolicyBinding {
  name: string;
  spec: PolicyBindingSpec;
  status?: object;
}

export class PolicyBindingSpec {
  policyTemplateRef: PolicyTemplateRef;
  kyvernoPolicyNamespace: KyvernoPolicyNamespace;
}
export class KyvernoPolicyNamespace {
  name: string;
}

export class PolicyTemplateRef {
  name: string;
  [key: string]: any;
}
