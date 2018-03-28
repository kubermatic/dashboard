import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';

export const datacenterFake1 = {
  metadata: {
    name: 'do-fra1',
    selfLink: '',
    uid: '',
    creationTimestamp: new Date(),
    labels: new Map(),
    annotations: new Map()
  },
  seed: undefined,
  spec: {
    seed: 'europe-west3-c',
    country: 'DE',
    digitalocean: {
      region: 'fra1'
    },
    bringyourown: undefined,
    openstack: undefined,
    aws: undefined,
    location: 'Frankfurt',
    provider: 'digitalocean'
  }
};

export const datacenterFake2 = {
  metadata: {
    name: 'do-fra1',
    selfLink: '',
    uid: '',
    creationTimestamp: new Date(),
    labels: new Map(),
    annotations: new Map()
  },
  seed: undefined,
  spec: {
    seed: 'europe-west3-c',
    country: 'DE',
    digitalocean: {
      region: 'fra1'
    },
    bringyourown: undefined,
    openstack: undefined,
    aws: undefined,
    location: 'Frankfurt',
    provider: 'digitalocean'
  }
};

export const datacenterFake3 = {
  metadata: {
    name: 'europe-west3-c',
    selfLink: '',
    uid: '',
    creationTimestamp: new Date(),
    labels: new Map(),
    annotations: new Map()
  },
  seed: true,
  spec: {
    seed: 'europe-west3-c',
    country: 'DE',
    digitalocean: undefined,
    bringyourown: undefined,
    openstack: undefined,
    aws: undefined,
    location: 'Frankfurt',
    provider: 'bringyourown'
  }
};
export const datacentersFake: DataCenterEntity[] = [
  datacenterFake1,
  datacenterFake2,
  datacenterFake3
];

export const seedDatacentersFake: string[] = ['europe-west3-c'];
