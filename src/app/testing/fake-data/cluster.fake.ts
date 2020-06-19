import {Cluster, ClusterType, Token} from '../../shared/entity/cluster';

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
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
  };
}

export function fakePacketCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'packet-ams',
        packet: {
          apiKey: '123',
          projectID: '1',
          billingCycle: 'hourly',
        },
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
  };
}

export function fakeGCPCluster(): Cluster {
  return {
    creationTimestamp: new Date(),
    id: '4k6txp5sq',
    name: 'nifty-haibt',
    spec: {
      cloud: {
        dc: 'gcp-westeurope',
        gcp: {
          serviceAccount: 'test-service-account',
          network: 'test-network',
          subnetwork: 'test-subnetwork',
        },
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
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
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
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
          vmNetName: '',
          folder: '',
          infraManagementUser: {
            username: 'foo',
            password: 'bar',
          },
        },
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
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
          accessKeyId: 'aaaaaaaaaaaa',
          secretAccessKey: 'bbbbbbbbbbbb',
          securityGroupID: '',
          vpcId: '',
          routeTableId: '',
          instanceProfileName: '',
          roleARN: '',
        },
      },
      version: '1.9.6',
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
    },
    type: ClusterType.Kubernetes,
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
          floatingIpPool: 'test-floating-ip-pool',
          securityGroups: 'test-security-group',
          network: 'test-network',
          domain: 'test-domain',
          tenant: 'test-tenant',
          tenantID: '',
          subnetID: 'test-subnet-id',
        },
      },
      version: '1.9.6',
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
    },
    type: ClusterType.Kubernetes,
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
          routeTable: 'azure-route-table',
          securityGroup: 'azure-security-group',
          subnet: 'azure-subnet',
          subscriptionID: 'azure-subscription-id',
          tenantID: 'azure-tenant-id',
          vnet: 'azure-vnet',
        },
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
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
      },
      version: '1.8.5',
    },
    status: {
      url: 'https://4k6txp5sq.europe-west3-c.dev.kubermatic.io:30002',
      version: '1.8.5',
    },
    type: ClusterType.Kubernetes,
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
      },
      version: '1.9.6',
    },
    status: {
      url: 'https://vr4m6wpqv6.europe-west3-c.dev.kubermatic.io:30003',
      version: '1.9.6',
    },
    type: ClusterType.Kubernetes,
  };
}

export function fakeToken(): Token {
  return {
    token: 'test-token',
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
