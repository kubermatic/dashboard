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

import {NamespaceBinding, ClusterBinding, ClusterRoleName, Kind, RoleName} from '@shared/entity/rbac';

export function fakeClusterBinding(): ClusterBinding {
  return {
    subjects: [
      {
        kind: Kind.User,
        name: 'test-3@example.com',
        namespace: 'default',
      },
    ],
    roleRefName: 'role-2',
  };
}

export function fakeNamespaceBinding(): NamespaceBinding {
  return {
    namespace: 'default',
    subjects: [
      {
        kind: Kind.User,
        name: 'test-1@example.com',
        namespace: 'default',
      },
    ],
    roleRefName: 'role-1',
  };
}

export function fakeClusterRoleNames(): ClusterRoleName[] {
  return [{name: 'role-1'}, {name: 'role-2'}, {name: 'role-3'}];
}

export function fakeNamespaceRoleNames(): ClusterRoleName[] {
  return [{name: 'namespace-1'}, {name: 'namespace-2'}, {name: 'namespace-3'}];
}

export function fakeRoleNames(): RoleName[] {
  return [
    {
      name: 'role-1',
      namespace: ['default', 'test'],
    },
    {
      name: 'role-2',
      namespace: ['default'],
    },
    {
      name: 'role-3',
      namespace: ['default-test', 'test-2'],
    },
  ];
}
