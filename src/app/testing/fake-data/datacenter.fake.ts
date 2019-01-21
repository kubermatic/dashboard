import {DataCenterEntity} from '../../shared/entity/DatacenterEntity';

export function fakeDigitaloceanDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'do-fra1',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: false,
    spec: {
      seed: 'europe-west3-c',
      country: 'DE',
      digitalocean: {
        region: 'fra1',
      },
      location: 'Frankfurt',
      provider: 'digitalocean',
    },
  };
}

export function fakeAWSDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'aws-fra1',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: false,
    spec: {
      seed: 'europe-west3-c',
      country: 'DE',
      aws: {
        region: 'fra1',
      },
      location: 'Frankfurt',
      provider: 'aws',
    },
  };
}

export function fakeOpenstackDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'os-fra1',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: false,
    spec: {
      seed: 'europe-west3-c',
      country: 'DE',
      openstack: {
        auth_url: 'loodse.com',
        availability_zone: 'az1',
        region: '',
        images: {
          coreos: '',
          centos: '',
          ubuntu: 'Ubuntu 16.04 LTS 2018.03.26',
        },
        enforce_floating_ip: false,
      },
      location: 'Frankfurt',
      provider: 'openstack',
    },
  };
}

export function fakeBringyourownSeedDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'europe-west3-c',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: true,
    spec: {
      seed: 'europe-west3-c',
      country: 'DE',
      bringyourown: {},
      location: 'Frankfurt',
      provider: 'bringyourown',
    },
  };
}

export function fakeAzureDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'azure-westeurope',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: false,
    spec: {
      azure: {
        location: 'westeurope',
      },
      country: 'NL',
      location: 'Azure West europe',
      provider: 'azure',
      seed: 'europe-west3-c',
    },
  };
}

export function fakeVSphereDatacenter(): DataCenterEntity {
  return {
    metadata: {
      name: 'vsphere-hetzner',
    },
    seed: false,
    spec: {
      seed: 'europe-west3-c',
      country: 'DE',
      location: 'Hetzner',
      provider: 'vsphere',
      vsphere: {
        cluster: 'loodse-cluster',
        endpoint: 'https://loodse.com',
        datacenter: 'Datacenter',
        datastore: 'datastore1',
        templates: {
          centos: 'centos-template',
          coreos: 'coreos-template',
          ubuntu: 'ubuntu-template',
        },
      },
    },
  };
}

export function fakeSeedDatacenters(): DataCenterEntity[] {
  return [fakeBringyourownSeedDatacenter()];
}

export function fakeNodeDatacenters(): DataCenterEntity[] {
  return [
    fakeDigitaloceanDatacenter(),
    fakeAWSDatacenter(),
    fakeOpenstackDatacenter(),
    fakeAzureDatacenter(),
    fakeBringyourownSeedDatacenter(),
    fakeVSphereDatacenter(),
  ];
}
