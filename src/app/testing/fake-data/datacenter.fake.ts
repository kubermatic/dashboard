import { DataCenterEntity } from '../../shared/entity/DatacenterEntity';

export const fakeDigitaloceanDatacenter: DataCenterEntity = {
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

export const fakeAWSDatacenter: DataCenterEntity = {
  metadata: {
    name: 'aws-fra1',
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
    aws: {
      region: 'fra1'
    },
    location: 'Frankfurt',
    provider: 'aws'
  }
};

export const fakeOpenstackDatacenter: DataCenterEntity = {
  metadata: {
    name: 'os-fra1',
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
    openstack: {
      auth_url: 'loodse.com',
      availability_zone: 'az1',
    },
    location: 'Frankfurt',
    provider: 'openstack'
  }
};

export const fakeBringyourownSeedDatacenter: DataCenterEntity = {
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
    bringyourown: {},
    location: 'Frankfurt',
    provider: 'bringyourown'
  }
};

export const fakeSeedDatacenters: DataCenterEntity[] = [fakeBringyourownSeedDatacenter];

export const fakeNodeDatacenters: DataCenterEntity[] = [
  fakeDigitaloceanDatacenter,
  fakeAWSDatacenter,
  fakeOpenstackDatacenter,
];
