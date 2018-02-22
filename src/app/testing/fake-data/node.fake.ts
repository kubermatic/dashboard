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
        openstack: null
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
      openstack : null
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
        openstack : null
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
        openstack : null
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
        kubeletVersion : null,
        operatingSystem : 'linux',
        architecture : 'amd64'
      },
      errorReason: null,
      errorMessage: null
    }
  }
];

export const digitaloceanSizesFake = {
    sizes : [
      {
        slug : '512mb',
        memory : 512,
        vcpus : 1,
        disk : 20,
        transfer : 1,
        price_monthly : 5,
        price_hourly : 0.00744,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : '1gb',
        memory : 1024,
        vcpus : 1,
        disk : 30,
        transfer : 2,
        price_monthly : 10,
        price_hourly : 0.01488,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : '2gb',
        memory : 2048,
        vcpus : 2,
        disk : 40,
        transfer : 3,
        price_monthly : 20,
        price_hourly : 0.02976,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 's-1vcpu-3gb',
        memory : 3072,
        vcpus : 1,
        disk : 60,
        transfer : 3,
        price_monthly : 15,
        price_hourly : 0.02232,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'c-2',
        memory : 4096,
        vcpus : 2,
        disk : 25,
        transfer : 5,
        price_monthly : 40,
        price_hourly : 0.06,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc3',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : '4gb',
        memory : 4096,
        vcpus : 2,
        disk : 60,
        transfer : 4,
        price_monthly : 40,
        price_hourly : 0.05952,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : '8gb',
        memory : 8192,
        vcpus : 4,
        disk : 80,
        transfer : 5,
        price_monthly : 80,
        price_hourly : 0.11905,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'c-4',
        memory : 8192,
        vcpus : 4,
        disk : 50,
        transfer : 5,
        price_monthly : 80,
        price_hourly : 0.119,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc3',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'm-1vcpu-8gb',
        memory : 8192,
        vcpus : 1,
        disk : 40,
        transfer : 5,
        price_monthly : 40,
        price_hourly : 0.0595238,
        regions : [
          'ams2',  'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : '16gb',
        memory : 16384,
        vcpus : 8,
        disk : 160,
        transfer : 6,
        price_monthly : 160,
        price_hourly : 0.2381,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'c-8',
        memory : 16384,
        vcpus : 8,
        disk : 100,
        transfer : 5,
        price_monthly : 160,
        price_hourly : 0.238,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc3',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'm-16gb',
        memory : 16384,
        vcpus : 2,
        disk : 60,
        transfer : 5,
        price_monthly : 75,
        price_hourly : 0.111607,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc2',  'nyc3',  'sfo1',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
      {
        slug : 'c-16',
        memory : 32768,
        vcpus : 16,
        disk : 200,
        transfer : 5,
        price_monthly : 320,
        price_hourly : 0.476,
        regions : [
          'ams3',  'blr1',  'fra1',  'lon1',  'nyc1',  'nyc3',  'sfo2',  'sgp1',  'tor1'
        ],
        available : 'true'
      },
    ],
    links : {
      pages : {
        last : 'https://api.digitalocean.com/v2/sizes?page=2',
        next : 'https://api.digitalocean.com/v2/sizes?page=2'
      }
    },
    meta : {
      total : 21
    }
};
