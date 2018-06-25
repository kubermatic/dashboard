import { NodeEntity } from '../../shared/entity/NodeEntity';
import { NodeData } from '../../shared/model/NodeSpecChange';


export const fakeDigitaloceanCreateNode: NodeEntity = {
  metadata: {},
  spec: {
    cloud: {
      digitalocean: {
        size: '4gb',
        backups: null,
        ipv6: null,
        monitoring: null,
        tags: null
      },
      aws: null,
      openstack: null,
      vsphere: null,
      hetzner: null,
      azure: null
    },
    operatingSystem: {
      ubuntu: {
        distUpgradeOnBoot: false
      },
      centos: null,
      containerLinux: null
    },
    versions: {
      kubelet: null,
      containerRuntime: {
        name: null,
        version: null
      }
    }
  }
};

export const nodeFake: NodeEntity = {
  metadata: {
    name: 'machine-kubermatic-tbbfvttvs-v5hmk',
    displayName: 'kubermatic-tbbfvttvs-v5hmk',
    deletionTimestamp: new Date(),
    annotations: new Map(),
    labels: new Map()
  },
  spec: {
    cloud: {
      digitalocean: {
        size: 's-1vcpu-1gb',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: []
      },
      aws: null,
      openstack: null,
      vsphere: null,
      hetzner: null,
      azure: null
    },
    operatingSystem: {
      ubuntu: {
        distUpgradeOnBoot: false
      },
      centos: null,
      containerLinux: null
    },
    versions: {
      kubelet: 'v1.8.5',
      containerRuntime: {
        name: 'docker',
        version: '17.03.2',
      }
    }
  },
  status: {
    machineName: 'machine-kubermatic-tbbfvttvs-v5hmk',
    capacity: {
      cpu: '1',
      memory: '2045940Ki'
    },
    allocatable: {
      cpu: '950m',
      memory: '1841140Ki'
    },
    addresses: [
      {
        type: 'InternalIP',
        address: '46.101.127.190'
      },
      {
        type: 'Hostname',
        address: 'kubermatic-tbbfvttvs-v5hmk'
      }
    ],
    nodeInfo: {
      kernelVersion: '4.14.11-coreos',
      containerRuntime: 'docker',
      containerRuntimeVersion: 'docker://Unknown',
      kubeletVersion: 'v1.8.5',
      operatingSystem: 'linux',
      architecture: 'amd64'
    },
    errorReason: null,
    errorMessage: null
  }
};

export const nodesFake: NodeEntity[] = [
  {
    metadata: {
      name: 'machine-kubermatic-tbbfvttvs-v5hmk',
      displayName: 'kubermatic-tbbfvttvs-v5hmk',
      deletionTimestamp: undefined,
      annotations: new Map(),
      labels: new Map()
    },
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: []
        },
        aws: null,
        openstack: null,
        vsphere: null,
        hetzner: null,
        azure: null
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false
        },
        centos: null,
        containerLinux: null
      },
      versions: {
        kubelet: 'v1.8.5',
        containerRuntime: {
          name: 'docker',
          version: '17.03.2',
        }
      }
    },
    status: {
      machineName: 'machine-kubermatic-tbbfvttvs-v5hmk',
      capacity: {
        cpu: '1',
        memory: '2045940Ki'
      },
      allocatable: {
        cpu: '950m',
        memory: '1841140Ki'
      },
      addresses: [
        {
          type: 'InternalIP',
          address: '46.101.127.190'
        },
        {
          type: 'Hostname',
          address: 'kubermatic-tbbfvttvs-v5hmk'
        }
      ],
      nodeInfo: {
        kernelVersion: '4.14.11-coreos',
        containerRuntime: 'docker',
        containerRuntimeVersion: 'docker://Unknown',
        kubeletVersion: 'v1.8.5',
        operatingSystem: 'linux',
        architecture: 'amd64'
      },
      errorReason: null,
      errorMessage: null
    }
  },
  {
    metadata: {
      name: 'machine-kubermatic-tbbfvttvs-v5hmk',
      displayName: 'kubermatic-tbbfvttvs-v5hmk',
      deletionTimestamp: undefined,
      annotations: new Map(),
      labels: new Map()
    },
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: []
        },
        aws: null,
        openstack: null,
        vsphere: null,
        hetzner: null,
        azure: null
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false
        },
        centos: null,
        containerLinux: null
      },
      versions: {
        kubelet: 'v1.8.5',
        containerRuntime: {
          name: 'docker',
          version: '17.03.2',
        }
      }
    },
    status: {
      machineName: null,
      capacity: {
        cpu: '1',
        memory: '2045940Ki'
      },
      allocatable: {
        cpu: '950m',
        memory: '1841140Ki'
      },
      addresses: [
        {
          type: 'InternalIP',
          address: '46.101.127.190'
        },
        {
          type: 'Hostname',
          address: 'kubermatic-tbbfvttvs-v5hmk'
        }
      ],
      nodeInfo: {
        kernelVersion: '4.14.11-coreos',
        containerRuntime: 'docker',
        containerRuntimeVersion: 'docker://Unknown',
        kubeletVersion: null,
        operatingSystem: 'linux',
        architecture: 'amd64'
      },
      errorReason: null,
      errorMessage: null
    }
  }
];

export const nodeDataFake: NodeData = {
  node: {
    metadata: {},
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: []
        },
        aws: {
          instanceType: 't2.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: ''
        },
        openstack: {
          flavor: 'm1.small',
          image: ''
        },
        hetzner: {
          type: 'cx31'
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: ''
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          tags: ''
        },
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false
        },
        centos: null,
        containerLinux: null
      },
      versions: {
        kubelet: null,
        containerRuntime: {
          name: null,
          version: null
        }
      }
    }
  },
  count: 3,
  valid: true,
};
