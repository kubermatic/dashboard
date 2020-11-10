// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Node} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';

export function fakeDigitaloceanCreateNode(): Node {
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
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false,
        },
      },
      versions: {
        kubelet: null,
      },
    },
  };
}

export function nodeFake(): Node {
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
      },
      operatingSystem: {
        ubuntu: {
          distUpgradeOnBoot: false,
        },
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

export function nodeAWSFake(): Node {
  return {
    id: 'worker-cht5l-684d57f97b-hkgrz',
    name: 'ip-172-31-1-240.eu-central-1.compute.internal',
    creationTimestamp: new Date(),
    spec: {
      cloud: {
        aws: {
          instanceType: 't3.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: {
            'kubernetes.io/cluster/2j6gn77spl': '',
          },
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
      },
      operatingSystem: {ubuntu: {distUpgradeOnBoot: false}},
      versions: {kubelet: '1.13.5'},
    },
    status: {
      machineName: 'worker-cht5l-684d57f97b-hkgrz',
      capacity: {cpu: '2', memory: '2002700Ki'},
      allocatable: {cpu: '1800m', memory: '1695500Ki'},
      addresses: [
        {type: 'InternalIP', address: '172.31.1.240'},
        {type: 'ExternalIP', address: '3.121.87.120'},
        {
          type: 'InternalDNS',
          address: 'ip-172-31-1-240.eu-central-1.compute.internal',
        },
        {
          type: 'Hostname',
          address: 'ip-172-31-1-240.eu-central-1.compute.internal',
        },
        {
          type: 'ExternalDNS',
          address: 'ec2-3-121-87-120.eu-central-1.compute.amazonaws.com',
        },
      ],
      nodeInfo: {
        kernelVersion: '4.15.0-1039-aws',
        containerRuntimeVersion: 'docker://18.9.2',
        kubeletVersion: 'v1.13.5',
        operatingSystem: 'linux',
        architecture: 'amd64',
      },
    },
  };
}

export function machineDeploymentsFake(): MachineDeployment[] {
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
          },
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            },
          },
          versions: {
            kubelet: null,
          },
        },
      },
      status: {
        availableReplicas: 3,
      },
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
          },
          operatingSystem: {
            ubuntu: {
              distUpgradeOnBoot: false,
            },
          },
          versions: {
            kubelet: null,
          },
        },
      },
    },
  ];
}

export function nodesFake(): Node[] {
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
        },
        operatingSystem: {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
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
        },
        operatingSystem: {
          ubuntu: {
            distUpgradeOnBoot: false,
          },
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
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
          instanceReadyCheckPeriod: '10',
          instanceReadyCheckTimeout: '120',
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
          zone: '1',
          tags: {},
        },
        packet: {
          instanceType: 'm1.small',
          tags: [],
        },
        gcp: {
          diskSize: 25,
          diskType: 'pd-ssd',
          machineType: '',
          zone: '',
          preemptible: false,
          tags: [],
          labels: {},
        },
        alibaba: {
          instanceType: 'ecs.c6.large',
          diskSize: '40',
          diskType: 'cloud_efficiency',
          vSwitchID: 'vsw-gw8g8mn4ohmj483hsylmn',
          internetMaxBandwidthOut: '10',
          zoneID: 'eu-central-1a',
          labels: {},
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
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
          instanceReadyCheckPeriod: '10',
          instanceReadyCheckTimeout: '120',
        },
        hetzner: {
          type: 'cx31',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
          diskSizeGB: 256,
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          zone: '1',
          tags: {},
        },
        gcp: {
          diskSize: 25,
          diskType: 'pd-ssd',
          machineType: '',
          zone: '',
          preemptible: false,
          tags: [],
          labels: {},
        },
      },
      operatingSystem: {
        centos: {
          distUpgradeOnBoot: false,
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
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
          instanceReadyCheckPeriod: '10',
          instanceReadyCheckTimeout: '120',
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
          zone: '1',
          tags: {},
        },
        gcp: {
          diskSize: 25,
          diskType: 'pd-ssd',
          machineType: '',
          zone: '',
          preemptible: false,
          tags: [],
          labels: {},
        },
      },
      operatingSystem: {
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

export function nodeDataSLESFake(): NodeData {
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
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        openstack: {
          flavor: 'm1.small',
          image: '',
          useFloatingIP: false,
          tags: {},
          instanceReadyCheckPeriod: '10',
          instanceReadyCheckTimeout: '120',
        },
        hetzner: {
          type: 'cx31',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
          diskSizeGB: 256,
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          zone: '1',
          tags: {},
        },
        gcp: {
          diskSize: 25,
          diskType: 'pd-ssd',
          machineType: '',
          zone: '',
          preemptible: false,
          tags: [],
          labels: {},
        },
      },
      operatingSystem: {
        sles: {
          distUpgradeOnBoot: false,
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

export function nodeDataRHELFake(): NodeData {
  return {
    spec: {
      cloud: {
        aws: {
          instanceType: 't3.small',
          diskSize: 25,
          volumeType: 'standard',
          ami: '',
          tags: {},
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        gcp: {
          diskSize: 25,
          diskType: 'pd-ssd',
          machineType: '',
          zone: '',
          preemptible: false,
          tags: [],
          labels: {},
        },
      },
      operatingSystem: {
        rhel: {
          distUpgradeOnBoot: false,
          rhelSubscriptionManagerUser: 'user',
          rhelSubscriptionManagerPassword: 'password',
          rhsmOfflineToken: 'dasdsaeiq3jjrojiq3wnjrfoqw3r',
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

export function nodeDataFlatcarFake(): NodeData {
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
          subnetID: 'subnet-f3427db9',
          availabilityZone: 'eu-central-1c',
        },
        vsphere: {
          cpus: 1,
          memory: 512,
          template: '',
        },
        azure: {
          size: 'cx31',
          assignPublicIP: false,
          zone: '1',
          tags: {},
        },
      },
      operatingSystem: {
        flatcar: {
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
