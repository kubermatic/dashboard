export class NodeProvider {
  static readonly AWS: string = 'aws';
  static readonly DIGITALOCEAN: string = 'digitalocean';
  static readonly BRINGYOUROWN: string = 'bringyourown';
  static readonly BAREMETAL: string = 'baremetal';
  static readonly OPENSTACK: string = 'openstack';
  static readonly VSPHERE: string = 'vsphere';
  static readonly HETZNER: string = 'hetzner';
  static readonly AZURE: string = 'azure';
  static readonly OPENSHIFT: string = 'openshift';

  static readonly Supported: string[] = [
    NodeProvider.AWS,
    NodeProvider.DIGITALOCEAN,
    NodeProvider.OPENSTACK,
    NodeProvider.BRINGYOUROWN,
    NodeProvider.VSPHERE,
    NodeProvider.HETZNER,
    NodeProvider.AZURE,
    NodeProvider.OPENSHIFT,
  ];
}

// Keep in sync with https://aws.amazon.com/ec2/instance-types/.
export namespace NodeInstanceFlavors {
  export const AWS: string[] = [
    // Only list instances which have at least 2gb of memory. Otherwise the node is full with required pods like
    // kube-proxy, cni, etc.
    't3.small', 't3.medium', 't3.large', 't3.xlarge', 't3.2xlarge', 'm5.large', 'm5d.large', 'm5.xlarge', 'm5.2xlarge',
    'm3.medium', 'c5.large', 'c5.xlarge', 'c5.2xlarge'
  ];
  export const Openstack: string[] = ['m1.micro', 'm1.tiny', 'm1.small', 'm1.medium', 'm1.large'];
  export const Hetzner: string[] =
      ['cx11', 'cx21', 'cx31', 'cx41', 'cx51', 'cx11-ceph', 'cx21-ceph', 'cx31-ceph', 'cx41-ceph', 'cx51-ceph'];
}
