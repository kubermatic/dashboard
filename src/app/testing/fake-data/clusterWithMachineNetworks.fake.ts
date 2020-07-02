import {Cluster, ClusterType} from '../../shared/entity/cluster';

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
          vmNetName: '',
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
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
    },
    type: ClusterType.Kubernetes,
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
          vmNetName: '',
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
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
    },
    type: ClusterType.Kubernetes,
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
          vmNetName: '',
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
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
    },
    type: ClusterType.Kubernetes,
  };
}
