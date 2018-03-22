import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { NodeEntityV2 } from '../../shared/entity/NodeEntity';

export const nodeModelFake: CreateNodeModel = {
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
        hetzner: null
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false
        },
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

export const nodeFake: NodeEntityV2 = {
  metadata : {
    name : 'machine-kubermatic-tbbfvttvs-v5hmk',
    displayName: 'kubermatic-tbbfvttvs-v5hmk',
    deletionTimestamp : new Date(),
    annotations : new Map(),
    labels : new Map()
  },
  spec : {
    cloud : {
      digitalocean : {
        size: 's-1vcpu-1gb',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: []
      },
      aws : null,
      openstack : null,
      hetzner : null
    },
    operatingSystem : {
      ubuntu : {
        distUpgradeOnBoot : false
      },
      containerLinux : null
    },
    versions : {
      kubelet: 'v1.8.5',
      containerRuntime: {
        name: 'docker',
        version: '17.03.2',
      }
    }
  },
  status : {
    machineName : 'machine-kubermatic-tbbfvttvs-v5hmk',
    capacity : {
      cpu : '1',
      memory : '2045940Ki'
    },
    allocatable : {
      cpu : '950m',
      memory : '1841140Ki'
    },
    addresses : [
      {
        type : 'InternalIP',
        address : '46.101.127.190'
      },
      {
        type : 'Hostname',
        address : 'kubermatic-tbbfvttvs-v5hmk'
      }
    ],
    nodeInfo : {
      kernelVersion : '4.14.11-coreos',
      containerRuntime : 'docker',
      containerRuntimeVersion : 'docker://Unknown',
      kubeletVersion : 'v1.8.5',
      operatingSystem : 'linux',
      architecture : 'amd64'
    },
    errorReason: null,
    errorMessage: null
  }
};

export const nodesFake: NodeEntityV2[] = [
  {
    metadata : {
      name : 'machine-kubermatic-tbbfvttvs-v5hmk',
      displayName: 'kubermatic-tbbfvttvs-v5hmk',
      deletionTimestamp : undefined,
      annotations : new Map(),
      labels : new Map()
    },
    spec : {
      cloud : {
        digitalocean : {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: []
        },
        aws : null,
        openstack : null,
        hetzner : null
      },
      operatingSystem : {
        ubuntu : {
          distUpgradeOnBoot : false
        },
        containerLinux : null
      },
      versions : {
        kubelet: 'v1.8.5',
        containerRuntime: {
          name: 'docker',
          version: '17.03.2',
        }
      }
    },
    status : {
      machineName : 'machine-kubermatic-tbbfvttvs-v5hmk',
      capacity : {
        cpu : '1',
        memory : '2045940Ki'
      },
      allocatable : {
        cpu : '950m',
        memory : '1841140Ki'
      },
      addresses : [
        {
          type : 'InternalIP',
          address : '46.101.127.190'
        },
        {
          type : 'Hostname',
          address : 'kubermatic-tbbfvttvs-v5hmk'
        }
      ],
      nodeInfo : {
        kernelVersion : '4.14.11-coreos',
        containerRuntime : 'docker',
        containerRuntimeVersion : 'docker://Unknown',
        kubeletVersion : 'v1.8.5',
        operatingSystem : 'linux',
        architecture : 'amd64'
      },
      errorReason: null,
      errorMessage: null
    }
  },
  {
    metadata : {
      name : 'machine-kubermatic-tbbfvttvs-v5hmk',
      displayName: 'kubermatic-tbbfvttvs-v5hmk',
      deletionTimestamp : undefined,
      annotations : new Map(),
      labels : new Map()
    },
    spec : {
      cloud : {
        digitalocean : {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: []
        },
        aws : null,
        openstack : null,
        hetzner : null
      },
      operatingSystem : {
        ubuntu : {
          distUpgradeOnBoot : false
        },
        containerLinux : null
      },
      versions : {
        kubelet: 'v1.8.5',
        containerRuntime: {
          name: 'docker',
          version: '17.03.2',
        }
      }
    },
    status : {
      machineName : null,
      capacity : {
        cpu : '1',
        memory : '2045940Ki'
      },
      allocatable : {
        cpu : '950m',
        memory : '1841140Ki'
      },
      addresses : [
        {
          type : 'InternalIP',
          address : '46.101.127.190'
        },
        {
          type : 'Hostname',
          address : 'kubermatic-tbbfvttvs-v5hmk'
        }
      ],
      nodeInfo : {
        kernelVersion : '4.14.11-coreos',
        containerRuntime : 'docker',
        containerRuntimeVersion : 'docker://Unknown',
        kubeletVersion : null,
        operatingSystem : 'linux',
        architecture : 'amd64'
      },
      errorReason: null,
      errorMessage: null
    }
  }
];
