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

import {UserGroupConfig} from '@shared/model/Config';

export function fakeUserGroupConfig(): UserGroupConfig {
  return {
    owners: {
      projects: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      members: {
        view: true,
        edit: true,
        delete: false,
        create: false,
      },
      sshkeys: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      clusters: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      nodes: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      machineDeployments: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      serviceaccounts: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      serviceaccountToken: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      rbac: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
    },
    editors: {
      projects: {
        view: true,
        edit: true,
        create: true,
        delete: false,
      },
      members: {
        view: false,
        edit: false,
        delete: false,
        create: false,
      },
      sshkeys: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      clusters: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      nodes: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      machineDeployments: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
      serviceaccounts: {
        view: false,
        edit: false,
        create: false,
        delete: false,
      },
      serviceaccountToken: {
        view: false,
        edit: false,
        create: false,
        delete: false,
      },
      rbac: {
        view: true,
        edit: true,
        create: true,
        delete: true,
      },
    },
    viewers: {
      projects: {
        view: true,
        edit: false,
        create: true,
        delete: false,
      },
      members: {
        view: false,
        edit: false,
        delete: false,
        create: false,
      },
      sshkeys: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      clusters: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      nodes: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      machineDeployments: {
        view: true,
        edit: false,
        create: false,
        delete: false,
      },
      serviceaccounts: {
        view: false,
        edit: false,
        create: false,
        delete: false,
      },
      serviceaccountToken: {
        view: false,
        edit: false,
        create: false,
        delete: false,
      },
      rbac: {
        view: false,
        edit: false,
        create: false,
        delete: false,
      },
    },
  };
}
