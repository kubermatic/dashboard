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
  KUBEVIRT = 'kubevirt',
  VSPHERE = 'vsphere',
  NONE = '',
}

export enum OperatingSystem {
  Ubuntu = 'ubuntu',
  CentOS = 'centos',
  ContainerLinux = 'containerLinux',
  SLES = 'sles',
}
