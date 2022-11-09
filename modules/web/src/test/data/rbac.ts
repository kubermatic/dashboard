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

import {
  Binding,
  ClusterBinding,
  ClusterRoleName,
  RoleName,
  SimpleBinding,
  SimpleClusterBinding,
} from '@shared/entity/rbac';

export function fakeClusterBinding(): ClusterBinding {
  return {
    subjects: [
      {
        kind: 'User',
        name: 'test-3@example.com',
      },
    ],
    roleRefName: 'role-2',
  };
}

export function fakeClusterBindings(): ClusterBinding[] {
  return [
    {
      subjects: [
        {
          kind: 'User',
          name: 'test-1@example.com',
        },
        {
          kind: 'User',
          name: 'test-2@example.com',
        },
      ],
      roleRefName: 'role-1',
    },
    {
      subjects: [
        {
          kind: 'User',
          name: 'test-3@example.com',
        },
      ],
      roleRefName: 'role-2',
    },
  ];
}

export function fakeSimpleClusterBindings(): SimpleClusterBinding[] {
  return [
    {
      name: 'test-1@example.com',
      role: 'role-1',
      kind: 'User',
    },
    {
      name: 'test-2@example.com',
      role: 'role-1',
      kind: 'User',
    },
    {
      name: 'test-3@example.com',
      role: 'role-2',
      kind: 'User',
    },
  ];
}

export function fakeBinding(): Binding {
  return {
    namespace: 'default',
    subjects: [
      {
        kind: 'User',
        name: 'test-1@example.com',
      },
    ],
    roleRefName: 'role-1',
  };
}

export function fakeBindings(): Binding[] {
  return [
    {
      namespace: 'default',
      subjects: [
        {
          kind: 'User',
          name: 'test-1@example.com',
        },
      ],
      roleRefName: 'role-1',
    },
    {
      namespace: 'default',
      subjects: [
        {
          kind: 'User',
          name: 'test-2@example.com',
        },
      ],
      roleRefName: 'role-2',
    },
    {
      namespace: 'test',
      subjects: [
        {
          kind: 'User',
          name: 'test-10@example.com',
        },
      ],
      roleRefName: 'role-10',
    },
  ];
}

export function fakeSimpleBindings(): SimpleBinding[] {
  return [
    {
      name: 'test-1@example.com',
      role: 'role-1',
      namespace: 'default',
      kind: 'User',
    },
    {
      name: 'test-2@example.com',
      role: 'role-2',
      namespace: 'default',
      kind: 'User',
    },
    {
      name: 'test-10@example.com',
      role: 'role-10',
      namespace: 'test',
      kind: 'User',
    },
  ];
}

export function fakeClusterRoleNames(): ClusterRoleName[] {
  return [{name: 'role-1'}, {name: 'role-2'}, {name: 'role-3'}];
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
