import { ClusterEntity } from '../../shared/entity/ClusterEntity';

// fakeClusterWithMachineNetwork could contain 6 IPs
export function fakeClusterWithMachineNetwork(): ClusterEntity {
  return {
    creationTimestamp: new Date(),
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
        azure: null
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8'],
          gateway: '190.128.0.2'
        }
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5'
    }
  };
}

// fakeGatewayInCidr could contain 6 IPs
export function fakeGatewayInCidr(): ClusterEntity {
  return {
    creationTimestamp: new Date(),
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
        azure: null
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8'],
          gateway: '192.182.0.2'
        }
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5'
    }
  };
}

// fakeGatewayNotInCidr could contain 6 IPs
export function fakeGatewayNotInCidr(): ClusterEntity {
  return {
    creationTimestamp: new Date(),
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
        azure: null
      },
      version: '1.8.5',
      machineNetworks: [
        {
          cidr: '192.182.0.0/29',
          dnsServers: ['8.8.8.8'],
          gateway: '192.180.0.2'
        }
      ],
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5'
    }
  };
}
