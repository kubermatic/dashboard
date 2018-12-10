import {NodeProvider} from '../model/NodeProviderConstants';
import {AWSCloudSpec} from './cloud/AWSCloudSpec';
import {AzureCloudSpec} from './cloud/AzureCloudSpec';
import {BareMetalCloudSpec} from './cloud/BareMetalCloudSpec';
import {BringYourOwnCloudSpec} from './cloud/BringYourOwnCloudSpec';
import {DigitaloceanCloudSpec} from './cloud/DigitaloceanCloudSpec';
import {FakeCloudSpec} from './cloud/FakeCloudSpec';
import {HetznerCloudSpec} from './cloud/HetznerCloudSpec';
import {OpenShiftCloudSpec, OpenstackCloudSpec} from './cloud/OpenstackCloudSpec';
import {VSphereCloudSpec} from './cloud/VSphereCloudSpec';

export function getClusterProvider(cluster: ClusterEntity): string {
  switch (true) {
    case !!cluster.spec.cloud.digitalocean: {
      return NodeProvider.DIGITALOCEAN;
    }
    case !!cluster.spec.cloud.aws: {
      return NodeProvider.AWS;
    }
    case !!cluster.spec.cloud.bringyourown: {
      return NodeProvider.BRINGYOUROWN;
    }
    case !!cluster.spec.cloud.openstack: {
      return NodeProvider.OPENSTACK;
    }
    case !!cluster.spec.cloud.baremetal: {
      return NodeProvider.BAREMETAL;
    }
    case !!cluster.spec.cloud.hetzner: {
      return NodeProvider.HETZNER;
    }
    case !!cluster.spec.cloud.vsphere: {
      return NodeProvider.VSPHERE;
    }
    case !!cluster.spec.cloud.azure: {
      return NodeProvider.AZURE;
    }
    case !!cluster.spec.cloud.openshift: {
      return NodeProvider.OPENSHIFT;
    }
  }
  return '';
}

export const enum Finalizer {
  DeleteVolumes = 'DeleteVolumes',
  DeleteLoadBalancers = 'DeleteLoadBalancers',
}

export class ClusterEntity {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: ClusterSpec;
  status?: Status;
}

export function getEmptyCloudProviderSpec(provider: string): object {
  switch (provider) {
    case NodeProvider.AWS:
      return {
        accessKeyId: '',
        secretAccessKey: '',
        routeTableId: '',
        vpcId: '',
        securityGroup: '',
        subnetId: '',
      } as AWSCloudSpec;
    case NodeProvider.DIGITALOCEAN:
      return {
        token: '',
      } as DigitaloceanCloudSpec;
    case NodeProvider.BAREMETAL:
      return {
        name: '',
      } as BareMetalCloudSpec;
    case NodeProvider.OPENSHIFT:
      return {
        name: '',
      } as OpenShiftCloudSpec;
    case NodeProvider.OPENSTACK:
      return {
        username: '',
        password: '',
        floatingIpPool: '',
        securityGroups: '',
        network: '',
        domain: 'Default',
        tenant: '',
        subnetID: '',
      } as OpenstackCloudSpec;
    case NodeProvider.BRINGYOUROWN:
      return {} as BringYourOwnCloudSpec;
    case NodeProvider.VSPHERE:
      return {
        username: '',
        password: '',
        vmNetName: '',
        infraManagementUser: {
          username: '',
          password: '',
        },
      } as VSphereCloudSpec;
    case NodeProvider.HETZNER:
      return {
        token: '',
      } as HetznerCloudSpec;
    case NodeProvider.AZURE:
      return {
        clientID: '',
        clientSecret: '',
        resourceGroup: '',
        routeTable: '',
        securityGroup: '',
        subnet: '',
        subscriptionID: '',
        tenantID: '',
        vnet: '',
      } as AzureCloudSpec;
  }
  return {};
}

export class CloudSpec {
  dc: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  openshift?: OpenShiftCloudSpec;
  baremetal?: BareMetalCloudSpec;
  vsphere?: VSphereCloudSpec;
  hetzner?: HetznerCloudSpec;
  azure?: AzureCloudSpec;
  fake?: FakeCloudSpec;
}

export class ClusterSpec {
  cloud: CloudSpec;
  machineNetworks?: MachineNetwork[];
  version?: string;
}

export class MachineNetwork {
  cidr: string;
  dnsServers: string[];
  gateway: string;
}

export class Status {
  url: string;
  version: string;
}

export class MasterVersion {
  version: string;
  default?: boolean;
  restrictedByKubeletVersion?: boolean;
}

export class Token {
  token: string;
}
