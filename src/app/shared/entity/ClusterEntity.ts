import { DigitaloceanCloudSpec } from './cloud/DigitaloceanCloudSpec';
import { BringYourOwnCloudSpec } from './cloud/BringYourOwnCloudSpec';
import { AWSCloudSpec } from './cloud/AWSCloudSpec';
import { MetadataEntity } from './MetadataEntity';
import { OpenstackCloudSpec } from './cloud/OpenstackCloudSpec';
import { BareMetalCloudSpec } from './cloud/BareMetalCloudSpec';
import { NodeProvider } from '../model/NodeProviderConstants';
import { VSphereCloudSpec } from './cloud/VSphereCloudSpec';
import { HetznerCloudSpec } from './cloud/HetznerCloudSpec';
import { AzureCloudSpec } from './cloud/AzureCloudSpec';
import { FakeCloudSpec } from './cloud/FakeCloudSpec';

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
  }
  return '';
}

export class ClusterEntity {
  creationTimestamp?: string;
  deletionTimestamp?: string;
  id?: string;
  name: string;
  spec: ClusterSpec;
  status?: Status;
}

export function getEmptyCloudProviderSpec(provider: string): object {
  switch (provider) {
    case NodeProvider.AWS:
      const awsSpec: AWSCloudSpec = {
        accessKeyId: '',
        secretAccessKey: '',
        routeTableId: '',
        vpcId: '',
        securityGroup: '',
        subnetId: '',
      };
      return awsSpec;
    case NodeProvider.DIGITALOCEAN:
      const doSpec: DigitaloceanCloudSpec = {
        token: ''
      };
      return doSpec;
    case NodeProvider.BAREMETAL:
      const bmSpec: BareMetalCloudSpec = {
        name: '',
      };
      return bmSpec;
    case NodeProvider.OPENSTACK:
      const osSpec: OpenstackCloudSpec = {
        username: '',
        password: '',
        floatingIpPool: '',
        securityGroups: '',
        network: '',
        domain: 'Default',
        tenant: '',
        subnetID: '',
      };
      return osSpec;
    case NodeProvider.BRINGYOUROWN:
      const byoSpec: BringYourOwnCloudSpec = {};
      return byoSpec;
    case NodeProvider.VSPHERE:
      const vsSpec: VSphereCloudSpec = {
        username: '',
        password: '',
        vmNetName: '',
      };
      return vsSpec;
    case NodeProvider.HETZNER:
      const hSpec: HetznerCloudSpec = {
        token: '',
      };
      return hSpec;
    case NodeProvider.AZURE:
      const azureSpec: AzureCloudSpec = {
        clientID: '',
        clientSecret: '',
        resourceGroup: '',
        routeTable: '',
        securityGroup: '',
        subnet: '',
        subscriptionID: '',
        tenantID: '',
        vnet: '',
      };
      return azureSpec;
  }
  return {};
}

export class CloudSpec {
  dc: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  baremetal?: BareMetalCloudSpec;
  vsphere?: VSphereCloudSpec;
  hetzner?: HetznerCloudSpec;
  azure?: AzureCloudSpec;
  fake?: FakeCloudSpec;
}

export class ClusterSpec {
  cloud: CloudSpec;
  version?: string;
}

export class Certificate {
  key: string;
  cert: string;
}

export class Status {
  url: string;
  version: string;
}

export class SSHKeyPair {
  privateKey: string;
  publicKey: string;
}

export class MasterVersion {
  version: string;
  allowedNodeVersions: string[];
  default?: boolean;
}

export class Token {
  token: string;
}
