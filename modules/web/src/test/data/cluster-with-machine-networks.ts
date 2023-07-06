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

import {Cluster, ExternalCCMMigrationStatus} from '@shared/entity/cluster';

// fakeClusterWithMachineNetwork could contain 6 IPs
export function fakeClusterWithMachineNetwork(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'vsphere-hetzner',
        vsphere: {
          username: 'foo',
          password: 'bar',
          networks: [''],
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
        providerName: 'vsphere',
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8', '8.8.1.1'],
          gateway: '190.128.0.2',
        },
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.NotNeeded,
    },
  };
}

// fakeGatewayInCidr could contain 6 IPs
export function fakeGatewayInCidr(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'vsphere-hetzner',
        vsphere: {
          username: 'foo',
          password: 'bar',
          networks: [''],
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
        providerName: 'vsphere',
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8'],
          gateway: '192.182.0.2',
        },
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.NotNeeded,
    },
  };
}

// fakeGatewayNotInCidr could contain 6 IPs
export function fakeGatewayNotInCidr(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'vsphere-hetzner',
        vsphere: {
          username: 'foo',
          password: 'bar',
          networks: [''],
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
        providerName: 'vsphere',
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8'],
          gateway: '192.180.0.2',
        },
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.NotNeeded,
    },
  };
}
