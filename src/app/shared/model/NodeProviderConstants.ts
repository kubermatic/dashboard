export enum NodeProvider {
  AWS = 'aws',
  AZURE = 'azure',
  DIGITALOCEAN = 'digitalocean',
  BAREMETAL = 'baremetal',
  BRINGYOUROWN = 'bringyourown',
  GCP = 'gcp',
  HETZNER = 'hetzner',
  OPENSTACK = 'openstack',
  PACKET = 'packet',
  VSPHERE = 'vsphere',
  NONE = '',
}

export class NodeInstanceFlavor {
  constructor(public id: string, public info?: string) {}

  toString(): string {
    if (this.info === null || this.info === '') {
      return this.id;
    }

    return `${this.id} (${this.info})`;
  }
}

// Only list instances which have at least 2 GB of memory. Otherwise the node is full with required pods like
// kube-proxy, cni, etc.
export namespace NodeInstanceFlavors {
  // Keep in sync with https://aws.amazon.com/ec2/instance-types/.
  export const AWS: NodeInstanceFlavor[] = [
    new NodeInstanceFlavor('t3.small', '2 vCPU, 2 GB'),
    new NodeInstanceFlavor('t3.medium', '2 vCPU, 4 GB'),
    new NodeInstanceFlavor('t3.large', '2 vCPU, 8 GB'),
    new NodeInstanceFlavor('t3.xlarge', '4 vCPU, 16 GB'),
    new NodeInstanceFlavor('t3.2xlarge', '8 vCPU, 32 GB'),
    new NodeInstanceFlavor('m5.large', '2 vCPU, 8 GB'),
    new NodeInstanceFlavor('m5d.large', '2 vCPU, 8 GB'),
    new NodeInstanceFlavor('m5.xlarge', '4 vCPU, 16 GB'),
    new NodeInstanceFlavor('m5.2xlarge', '8 vCPU, 32 GB'),
    new NodeInstanceFlavor('m3.medium', '1 vCPU, 3.75 GB'),
    new NodeInstanceFlavor('c5.large', '2 vCPU, 4 GB'),
    new NodeInstanceFlavor('c5.xlarge', '4 vCPU, 8 GB'),
    new NodeInstanceFlavor('c5.2xlarge', '8 vCPU, 16 GB'),
  ];

  // Keep in sync with https://www.packet.com/cloud/servers/.
  export const Packet: NodeInstanceFlavor[] = [
    new NodeInstanceFlavor('t1.small.x86', '4 Cores, 8 GB'),
    new NodeInstanceFlavor('c1.small.x86', '4 Cores, 32 GB'),
    new NodeInstanceFlavor('c2.medium.x86', '24 Cores, 64 GB'),
    new NodeInstanceFlavor('c1.large.x86', '16 Cores, 128 GB'),
    new NodeInstanceFlavor('m1.large.x86', '24 Cores, 256 GB'),
    new NodeInstanceFlavor('m2.large.x86', '28 Cores, 384 GB'),
    new NodeInstanceFlavor('s1.large.x86', '16 Cores, 128 GB'),
  ];

  export const Hetzner: NodeInstanceFlavor[] = [
    new NodeInstanceFlavor('cx11', '1 vCPU, 2 GB'),
    new NodeInstanceFlavor('cx21', '2 vCPU, 4 GB'),
    new NodeInstanceFlavor('cx31', '2 vCPU, 8 GB'),
    new NodeInstanceFlavor('cx41', '4 vCPU, 16 GB'),
    new NodeInstanceFlavor('cx51', '8 vCPU, 32 GB'),
    new NodeInstanceFlavor('cx11-ceph', '1 vCPU, 2 GB'),
    new NodeInstanceFlavor('cx21-ceph', '2 vCPU, 4 GB'),
    new NodeInstanceFlavor('cx31-ceph', '2 vCPU, 8 GB'),
    new NodeInstanceFlavor('cx41-ceph', '4 vCPU, 16 GB'),
    new NodeInstanceFlavor('cx51-ceph', '8 vCPU, 32 GB'),
  ];

  export namespace GCP {
    // remove 'local-ssd' for now, as this must be handled differently in the machine-controller
    export const DiskTypes: string[] = ['pd-ssd', 'pd-standard'];

    // https://cloud.google.com/compute/docs/machine-types
    export const MachineTypes: NodeInstanceFlavor[] = [
      new NodeInstanceFlavor('n1-standard-1', '1 vCPU, 3.75 GB'),
      new NodeInstanceFlavor('n1-standard-2', '2 vCPU, 7.50 GB'),
      new NodeInstanceFlavor('n1-standard-4', '4 vCPU, 15 GB'),
      new NodeInstanceFlavor('n1-standard-8', '8 vCPU, 30 GB'),
      new NodeInstanceFlavor('n1-standard-16', '16 vCPU, 60 GB'),
      new NodeInstanceFlavor('n1-standard-32', '32 vCPU, 120 GB'),
      new NodeInstanceFlavor('n1-standard-64', '64 vCPU, 240 GB'),
      new NodeInstanceFlavor('n1-standard-96', '96 vCPU, 360 GB'),
    ];
  }
}
