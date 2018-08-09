import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';

export const clusterModelFake: CreateClusterModel = {
  name: 'nifty-haibt',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: {
        token: 'd6fec6ec65cd1fe6b2e6bba7bef91395ad9e3539646ccf8ed9eeac01f629570d'
      },
      bringyourown: null,
      aws: null,
      openstack: null,
      baremetal: null,
      hetzner: null,
      vsphere: null,
      azure: null
    },
    version: '',
  },
  sshKeys: [
    'key-ssh1'
  ]
};

export const fakeDigitaloceanCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: '4k6txp5sq',
  name: 'nifty-haibt',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: {
        token: 'token'
      },
      aws: null,
      openstack: null,
      baremetal: null,
      bringyourown: null,
      hetzner: null,
      vsphere: null,
      azure: null,
      fake: null
    },
    version: '1.8.5',
  },
  status: {
    url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
    version: '1.8.5'
  }
};

export const fakeHetznerCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: '4k6txp5sq',
  name: 'nifty-haibt',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: null,
      aws: null,
      openstack: null,
      baremetal: null,
      bringyourown: null,
      vsphere: null,
      hetzner: {
        token: 'pixH4QgO2nbVY1Xoo8yVN0RPN2d3CBQYPKcPrfd1BWwFsWrKMsdUKyos7wYAa6hQ'
      },
      azure: null,
      fake: null
    },
    version: '1.8.5',
  },
  status: {
    url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
    version: '1.8.5'
  }
};

export const fakeVSphereCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: '4k6txp5sq',
  name: 'nifty-haibt',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: null,
      aws: null,
      openstack: null,
      baremetal: null,
      bringyourown: null,
      vsphere: {
        username: 'foo',
        password: 'bar',
        vmNetName: '',
      },
      hetzner: null,
      azure: null,
      fake: null
    },
    version: '1.8.5',
  },
  status: {
    url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
    version: '1.8.5'
  }
};

export const fakeAWSCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: 'vr4m6wpqv6',
  name: 'foo-bar',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: null,
      aws: {
        accessKeyId: 'aaaaaaaaaaaa',
        secretAccessKey: 'bbbbbbbbbbbb',
        securityGroup: '',
        vpcId: '',
        subnetId: '',
        routeTableId: '',
      },
      openstack: null,
      baremetal: null,
      bringyourown: null,
      hetzner: null,
      vsphere: null,
      azure: null,
      fake: null
    },
    version: '1.9.6',
  },
  status: {
    url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
    version: '1.9.6'
  }
};
export const fakeOpenstackCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: 'vr4m6wpqv6',
  name: 'foo-bar',
  spec: {
    cloud: {
      dc: 'os-fra1',
      digitalocean: null,
      aws: null,
      openstack: {
        username: 'test-username',
        password: 'test-password',
        floatingIpPool: 'test-floating-ip-pool',
        securityGroups: 'test-security-group',
        network: 'test-network',
        domain: 'test-domain',
        tenant: 'test-tenant',
        subnetID: 'test-subnet-id'
      },
      baremetal: null,
      bringyourown: null,
      hetzner: null,
      vsphere: null,
      azure: null,
      fake: null
    },
    version: '1.9.6',
  },
  status: {
    url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
    version: '1.9.6'
  }
};

export const fakeAzureCluster: ClusterEntity = {
  creationTimestamp: '2018-01-15T07:43:57Z',
  id: '4k6txp5sq',
  name: 'nifty-haibt',
  spec: {
    cloud: {
      dc: 'do-fra1',
      digitalocean: null,
      aws: null,
      openstack: null,
      baremetal: null,
      bringyourown: null,
      vsphere: null,
      hetzner: null,
      azure: {
        clientID: 'azure-client-id',
        clientSecret: 'azure-client-secret',
        resourceGroup: 'azure-resource-group',
        routeTable: 'azure-route-table',
        securityGroup: 'azure-security-group',
        subnet: 'azure-subnet',
        subscriptionID: 'azure-subscription-id',
        tenantID: 'azure-tenant-id',
        vnet: 'azure-vnet',
      },
      fake: null,
    },
    version: '1.8.5',
  },
  status: {
    url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
    version: '1.8.5'
  }
};

export const fakeClusters: ClusterEntity[] = [fakeDigitaloceanCluster, fakeAWSCluster, fakeOpenstackCluster, fakeHetznerCluster, fakeAzureCluster];

