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

export class ClusterRoleName {
  name: string;
}

export class ClusterRole {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  rules: Rules[];
}

export class ClusterBinding {
  namespace?: string;
  roleRefName: string;
  subjects: Subjects[];
}

export class Namespace {
  name: string;
}

export class RoleName {
  name: string;
  namespace: string[];
}

export class Role {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  namespace: string;
  rules: Rules[];
}

export class Binding {
  namespace: string;
  roleRefName: string;
  subjects: Subjects[];
}

export class CreateBinding {
  userEmail?: string;
  group?: string;
}

export class Rules {
  apiGroups: string[];
  nonResourceURLs: string[];
  resourceNames: string[];
  resources: string[];
  verbs: string[];
}

export class Subjects {
  kind?: Kind;
  name?: string;
  namespace: string;
}

export class SimpleClusterBinding {
  scope: 'Cluster' | 'Namespace';
  name?: string;
  kind?: string;
  clusterRole: string;
  namespace: string;
  subjectNamespace: string;
}

export class SimpleBinding {
  name: string;
  role: string;
  namespace: string;
  kind: string;
}

export class DeleteBindingBody {
  group: string;
  userEmail: string;
  serviceAccount: string;
  serviceAccountNamespace: string;
}

export enum Kind {
  Group = 'Group',
  User = 'User',
  ServiceAccount = 'ServiceAccount',
}
