export class NodeProvider {
  static readonly AWS: string = 'aws';
  static readonly DIGITALOCEAN: string = 'digitalocean';
  static readonly BRINGYOUROWN: string = 'bringyourown';
  static readonly BAREMETAL: string = 'baremetal';
  static readonly OPENSTACK: string = 'openstack';
  static readonly PACKET: string = 'packet';
  static readonly VSPHERE: string = 'vsphere';
  static readonly HETZNER: string = 'hetzner';
  static readonly AZURE: string = 'azure';
  static readonly GCP: string = 'gcp';

  static readonly Supported: string[] = [
    NodeProvider.AWS,
    NodeProvider.DIGITALOCEAN,
    NodeProvider.OPENSTACK,
    NodeProvider.PACKET,
    NodeProvider.BRINGYOUROWN,
    NodeProvider.VSPHERE,
    NodeProvider.HETZNER,
    NodeProvider.AZURE,
    NodeProvider.GCP,
  ];
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
    {id: 't3.small', info: '2 vCPU, 2 GB'},
    {id: 't3.medium', info: '2 vCPU, 4 GB'},
    {id: 't3.large', info: '2 vCPU, 8 GB'},
    {id: 't3.xlarge', info: '4 vCPU, 16 GB'},
    {id: 't3.2xlarge', info: '8 vCPU, 32 GB'},
    {id: 'm5.large', info: '2 vCPU, 8 GB'},
    {id: 'm5d.large', info: '2 vCPU, 8 GB'},
    {id: 'm5.xlarge', info: '4 vCPU, 16 GB'},
    {id: 'm5.2xlarge', info: '8 vCPU, 32 GB'},
    {id: 'm3.medium', info: '1 vCPU, 3.75 GB'},
    {id: 'c5.large', info: '2 vCPU, 4 GB'},
    {id: 'c5.xlarge', info: '4 vCPU, 8 GB'},
    {id: 'c5.2xlarge', info: '8 vCPU, 16 GB'},
  ];

  // Keep in sync with https://www.packet.com/cloud/servers/.
  export const Packet: NodeInstanceFlavor[] = [
    {id: 't1.small.x86', info: '4 Cores, 8 GB'},
    {id: 'c1.small.x86', info: '4 Cores, 32 GB'},
    {id: 'c2.medium.x86', info: '24 Cores, 64 GB'},
    {id: 'c1.large.x86', info: '16 Cores, 128 GB'},
    {id: 'm1.large.x86', info: '24 Cores, 256 GB'},
    {id: 'm2.large.x86', info: '28 Cores, 384 GB'},
    {id: 's1.large.x86', info: '16 Cores, 128 GB'},
  ];

  export const Openstack: NodeInstanceFlavor[] =
      [{id: 'm1.micro'}, {id: 'm1.tiny'}, {id: 'm1.small'}, {id: 'm1.medium'}, {id: 'm1.large'}];

  export const Hetzner: NodeInstanceFlavor[] = [
    {id: 'cx11', info: '1 vCPU, 2 GB'},
    {id: 'cx21', info: '2 vCPU, 4 GB'},
    {id: 'cx31', info: '2 vCPU, 8 GB'},
    {id: 'cx41', info: '4 vCPU, 16 GB'},
    {id: 'cx51', info: '8 vCPU, 32 GB'},
    {id: 'cx11-ceph', info: '1 vCPU, 2 GB'},
    {id: 'cx21-ceph', info: '2 vCPU, 4 GB'},
    {id: 'cx31-ceph', info: '2 vCPU, 8 GB'},
    {id: 'cx41-ceph', info: '4 vCPU, 16 GB'},
    {id: 'cx51-ceph', info: '8 vCPU, 32 GB'},
  ];

  export namespace GCP {
    // remove 'local-ssd' for now, as this must be handled differently in the machine-controller
    export const DiskTypes: string[] = ['pd-ssd', 'pd-standard'];

    // https://cloud.google.com/compute/docs/machine-types
    export const MachineTypes: NodeInstanceFlavor[] = [
      {id: 'n1-standard-1', info: '1 vCPU, 3.75 GB'},
      {id: 'n1-standard-2', info: '2 vCPU, 7.50 GB'},
      {id: 'n1-standard-4', info: '4 vCPU, 15 GB'},
      {id: 'n1-standard-8', info: '8 vCPU, 30 GB'},
      {id: 'n1-standard-16', info: '16 vCPU, 60 GB'},
      {id: 'n1-standard-32', info: '32 vCPU, 120 GB'},
      {id: 'n1-standard-64', info: '64 vCPU, 240 GB'},
      {id: 'n1-standard-96', info: '96 vCPU, 360 GB'},
    ];
  }
}
