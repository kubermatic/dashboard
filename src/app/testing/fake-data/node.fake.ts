import {NodeDeploymentEntity} from '../../shared/entity/NodeDeploymentEntity';
import {NodeEntity} from '../../shared/entity/NodeEntity';
import {NodeData} from '../../shared/model/NodeSpecChange';

export function fakeDigitaloceanCreateNode(): NodeEntity {
  return {
    spec: {
      cloud: {
        digitalocean: {
          size: '4gb',
          backups: null,
          ipv6: null,
          monitoring: null,
          tags: null,
        },
        aws: null,
        openstack: null,
        vsphere: null,
        hetzner: null,
        azure: null,
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false,
        },
        centos: null,
        containerLinux: null,
      },
      versions: {
        kubelet: null,
      },
    },
  };
}

export function nodeFake(): NodeEntity {
  return {
    id: 'machine-kubermatic-tbbfvttvs-v5hmk',
    name: 'kubermatic-tbbfvttvs-v5hmk',
    deletionTimestamp: new Date(),
    creationTimestamp: new Date(),
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: [],
        },
        aws: null,
        openstack: null,
        vsphere: null,
        hetzner: null,
        azure: null,
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false,
        },
        centos: null,
        containerLinux: null,
      },
      versions: {
        kubelet: 'v1.8.5',
      },
    },
    status: {
      machineName: 'machine-kubermatic-tbbfvttvs-v5hmk',
      capacity: {
        cpu: '1',
        memory: '2045940Ki',
      },
      allocatable: {
        cpu: '950m',
        memory: '1841140Ki',
      },
      addresses: [
        {
          type: 'InternalIP',
          address: '46.101.127.190',
        },
        {
          type: 'Hostname',
          address: 'kubermatic-tbbfvttvs-v5hmk',
        },
      ],
      nodeInfo: {
        kernelVersion: '4.14.11-coreos',
        kubeletVersion: 'v1.8.5',
        operatingSystem: 'linux',
        architecture: 'amd64',
        containerRuntimeVersion: 'docker://18.9.2',
      },
      errorReason: null,
      errorMessage: null,
    },
  };
}

export function nodeDeploymentsFake(): NodeDeploymentEntity[] {
  return [
    {
      id: 'machine-deployment-324343dfs-sdfsd',
      name: 'kubermatic-machine-deployment-dasd32',
      creationTimestamp: new Date(),
      spec: {
        replicas: 3,
        template: {
          cloud: {
            digitalocean: {
              size: '4gb',
              backups: null,
              ipv6: null,
              monitoring: null,
              tags: null,
            },
            aws: null,
            openstack: null,
            vsphere: null,
            hetzner: null,
            azure: null,
          },
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            },
            centos: null,
            containerLinux: null,
          },
          versions: {
            kubelet: null,
          },
        }
      },
      status: {
        availableReplicas: 3,
      }
    },
    {
      id: 'machine-deployment-r32234v23-333rg',
      name: 'kubermatic-machine-deployment-rw4tfr',
      creationTimestamp: new Date(),
      spec: {
        replicas: 3,
        template: {
          cloud: {
            digitalocean: {
              size: '2gb',
              backups: null,
              ipv6: null,
              monitoring: null,
              tags: null,
            },
            aws: null,
            openstack: null,
            vsphere: null,
            hetzner: null,
            azure: null,
          },
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            },
            centos: null,
            containerLinux: null,
          },
          versions: {
            kubelet: null,
          },
        }
      }
    }
  ];
}

export function nodesFake(): NodeEntity[] {
  return [
    {
      id: 'machine-kubermatic-tbbfvttvs-v5hmk',
      name: 'kubermatic-tbbfvttvs-v5hmk',
      creationTimestamp: new Date(),
      spec: {
        cloud: {
          digitalocean: {
            size: '4gb',
            backups: null,
            ipv6: null,
            monitoring: null,
            tags: null,
          },
          aws: null,
          openstack: null,
          vsphere: null,
          hetzner: null,
          azure: null,
        },
        operatingSystem: {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
          centos: null,
          containerLinux: null,
        },
        versions: {
          kubelet: null,
        },
      },
      status: {
        machineName: 'machine-kubermatic-tbbfvttvs-v5hmk',
        capacity: {
          cpu: '1',
          memory: '2045940Ki',
        },
        allocatable: {
          cpu: '950m',
          memory: '1841140Ki',
        },
        addresses: [
          {
            type: 'InternalIP',
            address: '46.101.127.190',
          },
          {
            type: 'Hostname',
            address: 'kubermatic-tbbfvttvs-v5hmk',
          },
        ],
        nodeInfo: {
          kernelVersion: '4.14.11-coreos',
          kubeletVersion: 'v1.8.5',
          operatingSystem: 'linux',
          architecture: 'amd64',
          containerRuntimeVersion: 'docker://18.9.2',
        },
        errorReason: null,
        errorMessage: null,
      },
    },
    {
      id: 'machine-kubermatic-tbbfvttvs-v5hmk',
      name: 'kubermatic-tbbfvttvs-v5hmk',
      creationTimestamp: new Date(),
      spec: {
        cloud: {
          digitalocean: {
            size: 's-1vcpu-1gb',
            backups: false,
            ipv6: false,
            monitoring: false,
            tags: [],
          },
          aws: null,
          openstack: null,
          vsphere: null,
          hetzner: null,
          azure: null,
        },
        operatingSystem: {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
          centos: null,
          containerLinux: null,
        },
        versions: {
          kubelet: 'v1.8.5',
        },
      },
      status: {
        machineName: 'machine-kubermatic-tbbfvttvs-v5hmk',
        capacity: {
          cpu: '1',
          memory: '2045940Ki',
        },
        allocatable: {
          cpu: '950m',
          memory: '1841140Ki',
        },
        addresses: [
          {
            type: 'InternalIP',
            address: '46.101.127.190',
          },
          {
            type: 'Hostname',
            address: 'kubermatic-tbbfvttvs-v5hmk',
          },
        ],
        nodeInfo: {
          kernelVersion: '4.14.11-coreos',
          kubeletVersion: null,
          operatingSystem: 'linux',
          architecture: 'amd64',
          containerRuntimeVersion: 'docker://18.9.2',
        },
        errorReason: null,
        errorMessage: null,
      },
    },
  ];
}

export function nodeDataFake(): NodeData {
  return {
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: [],
        },
        aws: {
          instanceType: 't3.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: {},
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
        },
        hetzner: {
          type: 'cx31',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          tags: {},
        },
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false,
        },
        centos: null,
        containerLinux: null,
      },
      versions: {
        kubelet: null,
      },
    },
    count: 3,
    valid: true,
  };
}

export function nodeDataCentOsFake(): NodeData {
  return {
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: [],
        },
        aws: {
          instanceType: 't3.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: {},
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
        },
        hetzner: {
          type: 'cx31',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          tags: {},
        },
      },
      operatingSystem: {
        ubuntu: null,
        centos: {
          distUpgradeOnBoot: false,
        },
        containerLinux: null,
      },
      versions: {
        kubelet: null,
      },
    },
    count: 3,
    valid: true,
  };
}

export function nodeDataContainerLinuxFake(): NodeData {
  return {
    spec: {
      cloud: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: false,
          monitoring: false,
          tags: [],
        },
        aws: {
          instanceType: 't3.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: {},
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
        },
        hetzner: {
          type: 'cx31',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          tags: {},
        },
      },
      operatingSystem: {
        ubuntu: null,
        centos: null,
        containerLinux: {
          disableAutoUpdate: false,
        },
      },
      versions: {
        kubelet: null,
      },
    },
    count: 3,
    valid: true,
  };
}
