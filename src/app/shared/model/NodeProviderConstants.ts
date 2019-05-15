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

  static readonly Supported: string[] = [
    NodeProvider.AWS,
    NodeProvider.DIGITALOCEAN,
    NodeProvider.OPENSTACK,
    NodeProvider.PACKET,
    NodeProvider.BRINGYOUROWN,
    NodeProvider.VSPHERE,
    NodeProvider.HETZNER,
    NodeProvider.AZURE,
  ];
}

// Only list instances which have at least 2 GB of memory. Otherwise the node is full with required pods like
// kube-proxy, cni, etc.
export namespace NodeInstanceFlavors {
  // Keep in sync with https://aws.amazon.com/ec2/instance-types/.
  export const AWS: string[] = [
    't3.small', 't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge', 'm5.large', 'm5d.large', 'm5.xlarge', 'm5.2xlarge',
    'm3.medium', 'c5.large', 'c5.xlarge', 'c5.2xlarge'
  ];

  // Keep in sync with https://www.packet.com/cloud/servers/.
  export const Packet: string[] =
      ['t1.small.x86', 'c1.small.x86', 'c2.medium.x86', 'c1.large.x86', 'm2.large.x86', 'm1.large.x86', 's1.large.x86'];

  export const Openstack: string[] = ['m1.micro', 'm1.tiny', 'm1.small', 'm1.medium', 'm1.large'];

  export const Hetzner: string[] =
      ['cx11', 'cx21', 'cx31', 'cx41', 'cx51', 'cx11-ceph', 'cx21-ceph', 'cx31-ceph', 'cx41-ceph', 'cx51-ceph'];
}
