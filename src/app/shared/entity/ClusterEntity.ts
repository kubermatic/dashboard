import { DigitaloceanCloudSpec } from './cloud/DigitialoceanCloudSpec';
import { BringYourOwnCloudSpec } from './cloud/BringYourOwnCloudSpec';
import { AWSCloudSpec } from './cloud/AWSCloudSpec';
import { MetadataEntity } from './MetadataEntity';
import { OpenstackCloudSpec } from './cloud/OpenstackCloudSpec';
import { BareMetalCloudSpec } from './cloud/BareMetalCloudSpec';
import { NodeProvider } from '../model/NodeProviderConstants';
import { VSphereCloudSpec } from './cloud/VSphereCloudSpec';

export function getProvider(cluster: ClusterEntity): string {
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
  }
  return '';
}

export class ClusterEntity {
  metadata: MetadataEntity;
  spec: ClusterSpec;
  address: Address;
  status: Status;
}

export class CloudSpec {
  dc: string;
  digitalocean?: DigitaloceanCloudSpec;
  aws?: AWSCloudSpec;
  bringyourown?: BringYourOwnCloudSpec;
  openstack?: OpenstackCloudSpec;
  baremetal?: BareMetalCloudSpec;
  vsphere?: VSphereCloudSpec;
}

export class ClusterSpec {
  cloud: CloudSpec;
  humanReadableName: string;
  masterVersion?: string;
}

export class Address {
  url: string;
  externalName: string;
  externalPort: number;
  kubeletToken: string;
  adminToken: string;
}

export class Certificate {
  key: string;
  cert: string;
}

export class Status {
  lastTransitionTime: Date;
  phase: string;
  lastDeployedMasterVersion: string;
  masterUpdatePhase: string;
  rootCA: Certificate;
  apiserverCert: Certificate;
  kubeletCert: Certificate;
  apiserverSshKey: SSHKeyPair;
  serviceAccountKey: string;
  namespaceName: string;
  health: Health;
}

export class Health {
  apiserver: boolean;
  controller: boolean;
  etcd: boolean;
  machineController: boolean;
  nodeController: boolean;
  scheduler: boolean;
  lastTransitionTime: string;
}

export class SSHKeyPair {
  privateKey: string;
  publicKey: string;
}
