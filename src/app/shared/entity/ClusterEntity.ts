import {DigitaloceanCloudSpec} from './cloud/DigitialoceanCloudSpec';
import {BringYourOwnCloudSpec} from './cloud/BringYourOwnCloudSpec';
import {AWSCloudSpec} from './cloud/AWSCloudSpec';
import {MetadataEntity} from './MetadataEntity';
import {OpenstackCloudSpec} from './cloud/OpenstackCloudSpec';
import {BareMetalCloudSpec} from './cloud/BareMetalCloudSpec';
import {NodeProvider} from '../model/NodeProviderConstants';
import {VSphereCloudSpec} from './cloud/VSphereCloudSpec';
import {HetznerCloudSpec} from './cloud/HetznerCloudSpec';

export function  getClusterProvider(cluster: ClusterEntity): string {
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
  }
  return '';
}

export function getClusterHealthStatus (cluster: ClusterEntity): string {
  if (!!cluster.status.health) {
    if (cluster.metadata.deletionTimestamp) {
      return 'statusDeleting';
    }

    if (cluster.status.health.apiserver && cluster.status.health.scheduler && cluster.status.health.controller && cluster.status.health.nodeController && cluster.status.health.etcd) {
      return 'statusRunning';
    }

    if (!cluster.status.health.apiserver) {
      return 'statusFailed';
    }
  }
  return 'statusWaiting';
}

export function isClusterRunning(cluster: ClusterEntity): boolean {
  if (!!cluster.status.health && cluster.status.health.apiserver) {
    return true;
  }
  return false;
}

export class ClusterEntity {
  metadata: MetadataEntity;
  spec: ClusterSpec;
  address?: Address;
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
        tenant: '',
        domain: '',
        username: '',
        password: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
      };
      return osSpec;
    case NodeProvider.BRINGYOUROWN:
      const byoSpec: BringYourOwnCloudSpec = {};
      return byoSpec;
    case NodeProvider.VSPHERE:
      const vsSpec: VSphereCloudSpec = {
        username: '',
        password: '',
      };
      return vsSpec;
    case NodeProvider.HETZNER:
      const hSpec: HetznerCloudSpec = {
        token: '',
      };
      return hSpec;
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
}

export class ClusterSpec {
  cloud: CloudSpec;
  humanReadableName?: string;
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
