import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';

export const datacenterFake1: DataCenterEntity = {
  metadata: {
    name: 'do-fra1',
    selfLink: '',
    uid: '',
    creationTimestamp: new Date(),
    labels: new Map(),
    annotations: new Map()
  },
  seed: false,
  spec: {
    seed: 'europe-west3-c',
    country: 'DE',
    digitalocean: {
      region: 'fra1'
    },
    location: 'Frankfurt',
    provider: 'digitalocean'
  }
};

export const datacenterFake2: DataCenterEntity = {
  metadata: {
    name: 'do-fra1',
    selfLink: '',
    uid: '',
    creationTimestamp: new Date(),
    labels: new Map(),
    annotations: new Map()
  },
  seed: false,
  spec: {
    seed: 'europe-west3-c',
    country: 'DE',
    digitalocean: {
      region: 'fra1'
    },
    location: 'Frankfurt',
    provider: 'digitalocean'
  }
};

export const datacenterFake3: DataCenterEntity = {
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
    digitalocean: {
      region: 'ams1',
    },
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
