export namespace NodeProviderConstants {
  export function displayName(provider: NodeProvider): string {
    switch (provider) {
      case NodeProvider.ALIBABA:
        return 'Alibaba';
      case NodeProvider.AWS:
        return 'AWS';
      case NodeProvider.AZURE:
        return 'Azure';
      case NodeProvider.BAREMETAL:
        return 'Bare-metal';
      case NodeProvider.BRINGYOUROWN:
        return 'BringYourOwn';
      case NodeProvider.DIGITALOCEAN:
        return 'DigitalOcean';
      case NodeProvider.GCP:
        return 'Google Cloud';
      case NodeProvider.HETZNER:
        return 'Hetzner';
      case NodeProvider.KUBEVIRT:
        return 'KubeVirt';
      case NodeProvider.OPENSTACK:
        return 'Openstack';
      case NodeProvider.PACKET:
        return 'Packet';
      case NodeProvider.VSPHERE:
        return 'VSphere';
      default:
        return '';
    }
  }
}

export enum NodeProvider {
  ALIBABA = 'alibaba',
  AWS = 'aws',
  AZURE = 'azure',
  DIGITALOCEAN = 'digitalocean',
  BAREMETAL = 'baremetal',
  BRINGYOUROWN = 'bringyourown',
  GCP = 'gcp',
  HETZNER = 'hetzner',
  OPENSTACK = 'openstack',
  PACKET = 'packet',
  KUBEVIRT = 'kubevirt',
  VSPHERE = 'vsphere',
  NONE = '',
}

export enum OperatingSystem {
  Ubuntu = 'ubuntu',
  CentOS = 'centos',
  ContainerLinux = 'containerLinux',
  SLES = 'sles',
  RHEL = 'rhel',
  Flatcar = 'flatcar',
}
