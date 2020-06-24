import {NodeSpec} from '../entity/node';

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
  CoreOS = 'coreos',
}

export namespace NodeProviderConstants {
  const PROVIDER_DISPLAY_NAMES = new Map<NodeProvider, string>([
    [NodeProvider.ALIBABA, 'Alibaba'],
    [NodeProvider.AWS, 'AWS'],
    [NodeProvider.AZURE, 'Azure'],
    [NodeProvider.BAREMETAL, 'Bare-metal'],
    [NodeProvider.BRINGYOUROWN, 'BringYourOwn'],
    [NodeProvider.DIGITALOCEAN, 'DigitalOcean'],
    [NodeProvider.GCP, 'Google Cloud'],
    [NodeProvider.HETZNER, 'Hetzner'],
    [NodeProvider.KUBEVIRT, 'KubeVirt'],
    [NodeProvider.OPENSTACK, 'Openstack'],
    [NodeProvider.PACKET, 'Packet'],
    [NodeProvider.VSPHERE, 'VSphere'],
  ]);

  export function displayName(provider: NodeProvider | string): string {
    return PROVIDER_DISPLAY_NAMES[provider];
  }

  export function getOperatingSystemSpecName(spec: NodeSpec) {
    if (spec.operatingSystem.ubuntu) {
      return OperatingSystem.Ubuntu;
    } else if (spec.operatingSystem.centos) {
      return OperatingSystem.CentOS;
    } else if (spec.operatingSystem.containerLinux) {
      return OperatingSystem.ContainerLinux;
    } else if (spec.operatingSystem.sles) {
      return OperatingSystem.SLES;
    } else if (spec.operatingSystem.rhel) {
      return OperatingSystem.RHEL;
    } else if (spec.operatingSystem.flatcar) {
      return OperatingSystem.Flatcar;
    }
    return '';
  }
}
