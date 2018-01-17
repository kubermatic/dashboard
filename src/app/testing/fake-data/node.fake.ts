import { CreateNodeModel } from './../../shared/model/CreateNodeModel';
import { NodeEntity } from '../../shared/entity/NodeEntity';

export const nodeModelFake: CreateNodeModel = {
    instances: 3,
    spec: {
      digitalocean: {
        size: '4gb'
      },
      aws: null,
      openstack: null,
      baremetal: null
    }
};

export const nodeFake: NodeEntity = {
  groupname: 'group',
  metadata : {
    name : 'kubermatic-tbbfvttvs-v5hmk',
    selfLink : '/api/v1/nodes/kubermatic-tbbfvttvs-v5hmk',
    uid : 'df2711c4-fb7d-11e7-a535-0a580a2c210c',
    creationTimestamp : new Date(),
    labels : new Map(),
    annotations : new Map()
  },
  spec : {
    podCIDR : '172.25.1.0/24',
    externalID : 'kubermatic-tbbfvttvs-v5hmk'
  },
  status : {
    capacity : {
      cpu : '1',
      memory : '2045940Ki',
      pods : '110'
    },
    allocatable : {
      cpu : '950m',
      memory : '1841140Ki',
      pods : '110'
    },
    conditions : [
      {
        type : 'KernelDeadlock',
        status : 'False',
        lastHeartbeatTime : new Date(),
        lastTransitionTime : new Date(),
        reason : 'KernelHasNoDeadlock',
        message : 'kernel has no deadlock'
      },
      {
        type : 'Ready',
        status : 'True',
        lastHeartbeatTime : new Date(),
        lastTransitionTime : new Date(),
        reason : 'KubeletReady',
        message : 'kubelet is posting ready status'
      },
      {
        type : 'OutOfDisk',
        status : 'False',
        lastHeartbeatTime : new Date(),
        lastTransitionTime : new Date(),
        reason : 'KubeletHasSufficientDisk',
        message : 'kubelet has sufficient disk space available'
      }
    ],
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
    daemonEndpoints : {
      kubeletEndpoint : {
        Port : 10250
      }
    },
    nodeInfo : {
      machineID : '01d0a0f066f8406ca465f1d50b09715f',
      systemUUID : '01D0A0F0-66F8-406C-A465-F1D50B09715F',
      bootID : 'd9077a9d-2337-4eab-8603-efe2e097b5e9',
      kernelVersion : '4.14.11-coreos',
      osImage : 'Container Linux by CoreOS 1576.5.0 (Ladybug)',
      containerRuntimeVersion : 'docker://Unknown',
      kubeletVersion : 'v1.8.5',
      kubeProxyVersion : 'v1.8.5',
      operatingSystem : 'linux',
      architecture : 'amd64'
    },
    images : [
      {
        names : [
          'kubermatic/hyperkube-amd64@sha256:6e78121c61340ca8137adb8cd88fd201f6b9647bccabf747501fbb1bcf3534e3',  'kubermatic/hyperkube-amd64:v1.8.5'
        ],
        sizeBytes : 512237319
      },
      {
        names : [
          'gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b',  'gcr.io/google_containers/node-problem-detector:v0.4.1'
        ],
        sizeBytes : 286572743
      }
    ]
  }
};

export const nodesFake: NodeEntity[] = [
  {
    groupname: 'group',
    metadata : {
      name : 'kubermatic-tbbfvttvs-v5hmk',
      selfLink : '/api/v1/nodes/kubermatic-tbbfvttvs-v5hmk',
      uid : 'df2711c4-fb7d-11e7-a535-0a580a2c210c',
      creationTimestamp : new Date(),
      labels : new Map(),
      annotations : new Map()
    },
    spec : {
      podCIDR : '172.25.1.0/24',
      externalID : 'kubermatic-tbbfvttvs-v5hmk'
    },
    status : {
      capacity : {
        cpu : '1',
        memory : '2045940Ki',
        pods : '110'
      },
      allocatable : {
        cpu : '950m',
        memory : '1841140Ki',
        pods : '110'
      },
      conditions : [
        {
          type : 'KernelDeadlock',
          status : 'False',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KernelHasNoDeadlock',
          message : 'kernel has no deadlock'
        },
        {
          type : 'Ready',
          status : 'True',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KubeletReady',
          message : 'kubelet is posting ready status'
        },
        {
          type : 'OutOfDisk',
          status : 'False',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KubeletHasSufficientDisk',
          message : 'kubelet has sufficient disk space available'
        }
      ],
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
      daemonEndpoints : {
        kubeletEndpoint : {
          Port : 10250
        }
      },
      nodeInfo : {
        machineID : '01d0a0f066f8406ca465f1d50b09715f',
        systemUUID : '01D0A0F0-66F8-406C-A465-F1D50B09715F',
        bootID : 'd9077a9d-2337-4eab-8603-efe2e097b5e9',
        kernelVersion : '4.14.11-coreos',
        osImage : 'Container Linux by CoreOS 1576.5.0 (Ladybug)',
        containerRuntimeVersion : 'docker://Unknown',
        kubeletVersion : 'v1.8.5',
        kubeProxyVersion : 'v1.8.5',
        operatingSystem : 'linux',
        architecture : 'amd64'
      },
      images : [
        {
          names : [
            'kubermatic/hyperkube-amd64@sha256:6e78121c61340ca8137adb8cd88fd201f6b9647bccabf747501fbb1bcf3534e3',  'kubermatic/hyperkube-amd64:v1.8.5'
          ],
          sizeBytes : 512237319
        },
        {
          names : [
            'gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b',  'gcr.io/google_containers/node-problem-detector:v0.4.1'
          ],
          sizeBytes : 286572743
        }
      ]
    }
  },
  {
    groupname: 'group',
    metadata : {
      name : 'kubermatic-tbbfvttvs-v5hmk',
      selfLink : '/api/v1/nodes/kubermatic-tbbfvttvs-v5hmk',
      uid : 'df2711c4-fb7d-11e7-a535-0a580a2c210c',
      creationTimestamp : new Date(),
      labels : new Map(),
      annotations : new Map()
    },
    spec : {
      podCIDR : '172.25.1.0/24',
      externalID : 'kubermatic-tbbfvttvs-v5hmk'
    },
    status : {
      capacity : {
        cpu : '1',
        memory : '2045940Ki',
        pods : '110'
      },
      allocatable : {
        cpu : '950m',
        memory : '1841140Ki',
        pods : '110'
      },
      conditions : [
        {
          type : 'KernelDeadlock',
          status : 'False',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KernelHasNoDeadlock',
          message : 'kernel has no deadlock'
        },
        {
          type : 'Ready',
          status : 'True',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KubeletReady',
          message : 'kubelet is posting ready status'
        },
        {
          type : 'OutOfDisk',
          status : 'False',
          lastHeartbeatTime : new Date(),
          lastTransitionTime : new Date(),
          reason : 'KubeletHasSufficientDisk',
          message : 'kubelet has sufficient disk space available'
        }
      ],
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
      daemonEndpoints : {
        kubeletEndpoint : {
          Port : 10250
        }
      },
      nodeInfo : {
        machineID : '01d0a0f066f8406ca465f1d50b09715f',
        systemUUID : '01D0A0F0-66F8-406C-A465-F1D50B09715F',
        bootID : 'd9077a9d-2337-4eab-8603-efe2e097b5e9',
        kernelVersion : '4.14.11-coreos',
        osImage : 'Container Linux by CoreOS 1576.5.0 (Ladybug)',
        containerRuntimeVersion : 'docker://Unknown',
        kubeletVersion : 'v1.8.5',
        kubeProxyVersion : 'v1.8.5',
        operatingSystem : 'linux',
        architecture : 'amd64'
      },
      images : [
        {
          names : [
            'kubermatic/hyperkube-amd64@sha256:6e78121c61340ca8137adb8cd88fd201f6b9647bccabf747501fbb1bcf3534e3',  'kubermatic/hyperkube-amd64:v1.8.5'
          ],
          sizeBytes : 512237319
        },
        {
          names : [
            'gcr.io/google_containers/node-problem-detector@sha256:f95cab985c26b2f46e9bd43283e0bfa88860c14e0fb0649266babe8b65e9eb2b',  'gcr.io/google_containers/node-problem-detector:v0.4.1'
          ],
          sizeBytes : 286572743
        }
      ]
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
