// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Datacenter} from '@shared/entity/datacenter';

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

export function fakeVSphereDatacenter(): Datacenter {
  return {
    metadata: {
      name: 'vsphere-hetzner',
    },
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

export function fakeNodeDatacenters(): Datacenter[] {
  return [
    fakeDigitaloceanDatacenter(),
    fakeAWSDatacenter(),
    fakeOpenstackDatacenter(),
    fakeAzureDatacenter(),
    fakeVSphereDatacenter(),
  ];
}
