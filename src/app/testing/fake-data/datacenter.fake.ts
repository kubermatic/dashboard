import {Datacenter} from '../../shared/entity/datacenter';

export function fakeDigitaloceanDatacenter(): Datacenter {
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
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeAWSDatacenter(): Datacenter {
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
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeOpenstackDatacenter(): Datacenter {
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
          sles: '',
          rhel: '',
        },
        enforce_floating_ip: false,
      },
      location: 'Frankfurt',
      provider: 'openstack',
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeBringyourownSeedDatacenter(): Datacenter {
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
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeAzureDatacenter(): Datacenter {
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
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeGCPDatacenter(): Datacenter {
  return {
    metadata: {
      name: 'gcp-westeurope',
      selfLink: '',
      uid: '',
      creationTimestamp: new Date(),
      labels: new Map(),
      annotations: new Map(),
    },
    seed: false,
    spec: {
      gcp: {
        region: 'europe-west3',
        regional: false,
        zone_suffixes: ['c'],
      },
      country: 'DE',
      location: 'Europe West (Germany)',
      provider: 'google',
      seed: 'europe-west3-c',
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeVSphereDatacenter(): Datacenter {
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
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
      vsphere: {
        cluster: 'loodse-cluster',
        endpoint: 'https://loodse.com',
        datacenter: 'Datacenter',
        datastore: 'datastore1',
        templates: {
          centos: 'centos-template',
          coreos: 'coreos-template',
          ubuntu: 'ubuntu-template',
          flatcar: 'flatcar-template',
        },
      },
    },
  };
}

export function fakeAlibabaDatacenter(): Datacenter {
  return {
    metadata: {
      name: 'alibaba-eu-central-1a',
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
      alibaba: {
        region: 'alibaba-eu-central-1',
      },
      location: 'Frankfurt',
      provider: 'alibaba',
      enforceAuditLogging: false,
      enforcePodSecurityPolicy: false,
    },
  };
}

export function fakeSeedDatacenters(): Datacenter[] {
  return [fakeBringyourownSeedDatacenter()];
}

export function fakeNodeDatacenters(): Datacenter[] {
  return [
    fakeDigitaloceanDatacenter(),
    fakeAWSDatacenter(),
    fakeOpenstackDatacenter(),
    fakeAzureDatacenter(),
    fakeBringyourownSeedDatacenter(),
    fakeVSphereDatacenter(),
  ];
}
