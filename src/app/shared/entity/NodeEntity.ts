import {NodeProvider} from '../model/NodeProviderConstants';
import {AWSNodeSpec} from './node/AWSNodeSpec';
import {AzureNodeSpec} from './node/AzureNodeSpec';
import {DigitaloceanNodeSpec} from './node/DigitaloceanNodeSpec';
import {HetznerNodeSpec} from './node/HetznerNodeSpec';
import {OpenstackNodeSpec} from './node/OpenstackNodeSpec';
import {VSphereNodeSpec} from './node/VSphereNodeSpec';

export class NodeEntity {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  spec: NodeSpec;
  status?: NodeStatus;
}

export class NodeSpec {
  cloud: NodeCloudSpec;
  operatingSystem: OperatingSystemSpec;
  versions?: NodeVersionInfo;
}

export class NodeCloudSpec {
  digitalocean?: DigitaloceanNodeSpec;
  aws?: AWSNodeSpec;
  openstack?: OpenstackNodeSpec;
  hetzner?: HetznerNodeSpec;
  vsphere?: VSphereNodeSpec;
  azure?: AzureNodeSpec;
}

export class OperatingSystemSpec {
  ubuntu?: UbuntuSpec;
  centos?: CentosSpec;
  containerLinux?: ContainerLinuxSpec;
}

export class UbuntuSpec {
  distUpgradeOnBoot: boolean;
}

export class CentosSpec {
  distUpgradeOnBoot: boolean;
}

export class ContainerLinuxSpec {
  disableAutoUpdate: boolean;
}

export class NodeVersionInfo {
  kubelet?: string;
}

export class NodeStatus {
  machineName?: string;
  capacity?: NodeResources;
  allocatable?: NodeResources;
  addresses?: NodeAddress[];
  nodeInfo?: NodeSystemInfo;
  errorReason?: string;
  errorMessage?: string;
}

export class NodeResources {
  cpu: string;
  memory: string;
}

export class NodeAddress {
  type: string;
  address: string;
}

export class NodeSystemInfo {
  kernelVersion: string;
  kubeletVersion: string;
  operatingSystem: string;
  architecture: string;
}

export function getEmptyNodeProviderSpec(provider: string): object {
  switch (provider) {
    case NodeProvider.AWS:
      const awsSpec: AWSNodeSpec = {
        instanceType: 't2.small',
        diskSize: 25,
        volumeType: 'standard',
        ami: '',
        tags: {'': ''},
      };
      return awsSpec;
    case NodeProvider.DIGITALOCEAN:
      const doSpec: DigitaloceanNodeSpec = {
        size: 's-1vcpu-1gb',
        backups: false,
        ipv6: false,
        monitoring: false,
        tags: [],
      };
      return doSpec;
    case NodeProvider.OPENSTACK:
      const osSpec: OpenstackNodeSpec = {
        flavor: 'm1.small',
        image: '',
        useFloatingIP: false,
        tags: {'': ''},
      };
      return osSpec;
    case NodeProvider.VSPHERE:
      const vsSpec: VSphereNodeSpec = {
        cpus: 1,
        memory: 512,
        template: 'ubuntu-template',
      };
      return vsSpec;
    case NodeProvider.HETZNER:
      const hSpec: HetznerNodeSpec = {
        type: 'cx31',
      };
      return hSpec;
    case NodeProvider.AZURE:
      const azureSpec: AzureNodeSpec = {
        size: 'Standard_A0',
        assignPublicIP: false,
        tags: {'': ''},
      };
      return azureSpec;
  }
  return {};
}

export function getEmptyOperatingSystemSpec(): OperatingSystemSpec {
  return {
    ubuntu: {
      distUpgradeOnBoot: false,
    },
  };
}

export function getEmptyNodeVersionSpec(): NodeVersionInfo {
  return {};
}
