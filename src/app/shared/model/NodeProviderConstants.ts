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

  static readonly ProviderNames: object = {
    [NodeProvider.AWS]: 'Amazon Web Services',
    [NodeProvider.DIGITALOCEAN]: 'Digital Ocean',
    [NodeProvider.OPENSTACK]: 'Openstack',
    [NodeProvider.BRINGYOUROWN]: 'Bring Your Own',
    [NodeProvider.VSPHERE]: 'VMware vSphere',
    [NodeProvider.HETZNER]: 'Hetzner cloud',
    [NodeProvider.AZURE]: 'Azure',
    [NodeProvider.OPENSHIFT]: 'OpenShift',
  };
}

export namespace NodeInstanceFlavors {
  export const AWS: string[] = [
    't2.nano', 't2.micro', 't2.small', 't2.medium', 't2.large', 'm4.large', 'm4.xlarge', 'm4.2xlarge', 'm4.4xlarge',
    'm4.10xlarge', 'm4.16xlarge', 'm3.medium', 'm3.large', 'm3.xlarge', 'm3.2xlarge'
  ];
  export const Openstack: string[] = ['m1.micro', 'm1.tiny', 'm1.small', 'm1.medium', 'm1.large'];
  export const Hetzner: string[] =
      ['cx11', 'cx21', 'cx31', 'cx41', 'cx51', 'cx11-ceph', 'cx21-ceph', 'cx31-ceph', 'cx41-ceph', 'cx51-ceph'];
  export const VOID: string[] = [];
}
