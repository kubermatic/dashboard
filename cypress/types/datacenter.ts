export enum Provider {
  Alibaba = 'alibaba',
  Anexia = 'anexia',
  AWS = 'aws',
  Azure = 'azure',
  kubeAdm = 'bringyourown',
  Digitalocean = 'digitalocean',
  GCP = 'gcp',
  Hetzner = 'hetzner',
  KubeVirt = 'kubevirt',
  Nutanix = 'nutanix',
  OpenStack = 'openstack',
  Equinix = 'packet',
  VSphere = 'vsphere',
}

export enum Alibaba {
  Frankfurt = 'Frankfurt',
}

export enum Anexia {
  Vienna = 'Vienna',
}

export enum AWS {
  Frankfurt = 'Frankfurt',
}

export enum Azure {
  WestEurope = 'West europe',
}

export enum BringYourOwn {
  Frankfurt = 'Frankfurt',
  Hamburg = 'Hamburg',
}

export enum Digitalocean {
  Frankfurt = 'Frankfurt',
}

export enum GCP {
  Germany = 'Germany',
}

export enum Hetzner {
  Nuremberg = 'Nuremberg 1 DC 3',
}

export enum KubeVirt {
  Frankfurt = 'Frankfurt',
}

export enum Nutanix {
  Hamburg = 'Hamburg',
}

export enum Openstack {
  Syseleven = 'dbl1',
}

export enum Equinix {
  NewYork = 'New York',
}

export enum VSphere {
  Hamburg = 'Hamburg',
}

export type Datacenter =
  | Alibaba
  | Anexia
  | AWS
  | Azure
  | BringYourOwn
  | Digitalocean
  | GCP
  | Hetzner
  | KubeVirt
  | Nutanix
  | Openstack
  | Equinix
  | VSphere;
