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

import {Cluster, CNIPlugin, ExternalCCMMigrationStatus, ProxyMode} from '@shared/entity/cluster';

export function fakeDigitaloceanCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'do-fra1',
        digitalocean: {
          token: 'token',
        },
        providerName: 'digitalocean',
      },
      version: '1.8.5',
      clusterNetwork: {
        proxyMode: ProxyMode.iptables,
      },
      cniPlugin: {
        type: CNIPlugin.Cilium,
        version: 'v1.11',
      },
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeHetznerCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'do-fra1',
        hetzner: {
          token: 'pixH4QgO2nbVY1Xoo8yVN0RPN2d3CBQYPKcPrfd1BWwFsWrKMsdUKyos7wYAa6hQ',
        },
        providerName: 'digitalocean',
      },
      version: '1.8.5',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.NotNeeded,
    },
  };
}

export function fakeVSphereCluster(): Cluster {
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
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeAWSCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: 'vr4m6wpqv6',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'aws-fra1',
        aws: {
          accessKeyID: 'aaaaaaaaaaaa',
          secretAccessKey: 'bbbbbbbbbbbb',
          assumeRoleARN: '',
          assumeRoleExternalID: '',
          securityGroupID: '',
          vpcID: '',
          routeTableID: '',
          instanceProfileName: '',
          roleARN: '',
        },
        providerName: 'aws',
      },
      version: '1.9.6',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeOpenstackCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: 'vr4m6wpqv6',
    name: 'foo-bar',
    spec: {
      cloud: {
        dc: 'os-fra1',
        openstack: {
          username: 'test-username',
          password: 'test-password',
          floatingIPPool: 'test-floating-ip-pool',
          securityGroups: 'test-security-group',
          network: 'test-network',
          domain: 'test-domain',
          project: 'test-tenant',
          projectID: '',
          subnetID: 'test-subnet-id',
          ipv6SubnetID: '',
          ipv6SubnetPool: '',
        },
        providerName: 'openstack',
      },
      version: '1.9.6',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeAzureCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'do-fra1',
        azure: {
          clientID: 'azure-client-id',
          clientSecret: 'azure-client-secret',
          resourceGroup: 'azure-resource-group',
          vnetResourceGroup: 'azure-vnet-resource-group',
          routeTable: 'azure-route-table',
          securityGroup: 'azure-security-group',
          subnet: 'azure-subnet',
          subscriptionID: 'azure-subscription-id',
          tenantID: 'azure-tenant-id',
          vnet: 'azure-vnet',
          loadBalancerSKU: 'standard',
          assignAvailabilitySet: true,
        },
        providerName: 'azure',
      },
      version: '1.8.5',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeBringyourownCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'do-fra1',
        bringyourown: {},
        providerName: 'bringyourown',
      },
      version: '1.8.5',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeAlibabaCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: 'vr4m6wpqv6',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'alibaba-eu-central-1a:',
        alibaba: {
          accessKeyID: 'ali-access-key-id',
          accessKeySecret: 'ali-access-key-secret',
        },
        providerName: 'alibaba',
      },
      version: '1.9.6',
      apiServerAllowedIPRanges: {
        cidrBlocks: ['10.0.0.0/8'],
      },
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
      externalCCMMigration: ExternalCCMMigrationStatus.Unsupported,
    },
  };
}

export function fakeClusters(): Cluster[] {
  return [
    fakeDigitaloceanCluster(),
    fakeAWSCluster(),
    fakeOpenstackCluster(),
    fakeHetznerCluster(),
    fakeAzureCluster(),
    fakeBringyourownCluster(),
    fakeAlibabaCluster(),
  ];
}
