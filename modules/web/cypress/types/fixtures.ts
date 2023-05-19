// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {DEFAULT_ADMIN_SETTINGS, DEFAULT_USER_SETTINGS} from '../../src/app/shared/entity/settings';

enum Alibaba {
  ClusterList = 'alibaba/clusters.json',
  Cluster = 'alibaba/cluster.json',
  MachineDeploymentList = 'alibaba/machinedeployments.json',
  MachineDeployment = 'alibaba/machinedeployment.json',
  InstanceTypes = 'alibaba/instancetypes/json',
  VSwitches = 'alibaba/vswitches.json',
  Zones = 'alibaba/zones.json',
}

enum Anexia {
  ClusterList = 'anexia/clusters.json',
  Cluster = 'anexia/cluster.json',
  MachineDeploymentList = 'anexia/machinedeployments.json',
  MachineDeployment = 'anexia/machinedeployment.json',
}

enum AWS {
  ClusterList = 'aws/clusters.json',
  Cluster = 'aws/cluster.json',
  MachineDeploymentList = 'aws/machinedeployments.json',
  MachineDeployment = 'aws/machinedeployment.json',
}

enum Azure {
  ClusterList = 'azure/clusters.json',
  Cluster = 'azure/cluster.json',
  MachineDeploymentList = 'azure/machinedeployments.json',
  MachineDeployment = 'azure/machinedeployment.json',
}

enum BringYourOwn {
  ClusterList = 'bringyourown/clusters.json',
  Cluster = 'bringyourown/cluster.json',
  MachineDeploymentList = 'bringyourown/machinedeployments.json',
  MachineDeployment = 'bringyourown/machinedeployment.json',
}

enum Digitalocean {
  ClusterList = 'digitalocean/clusters.json',
  Cluster = 'digitalocean/cluster.json',
  MachineDeploymentList = 'digitalocean/machinedeployments.json',
  MachineDeployment = 'digitalocean/machinedeployment.json',
  Sizes = 'digitalocean/sizes.json',
}

enum Equinix {
  ClusterList = 'equinix/clusters.json',
  Cluster = 'equinixcluster.json',
  MachineDeploymentList = 'equinix/machinedeployments.json',
  MachineDeployment = 'equinix/machinedeployment.json',
}

enum GCP {
  ClusterList = 'gcp/clusters.json',
  Cluster = 'gcp/cluster.json',
  MachineDeploymentList = 'gcp/machinedeployments.json',
  MachineDeployment = 'gcp/machinedeployment.json',
}

enum Hetzner {
  ClusterList = 'hetzner/clusters.json',
  Cluster = 'hetzner/cluster.json',
  MachineDeploymentList = 'hetzner/machinedeployments.json',
  MachineDeployment = 'hetzner/machinedeployment.json',
}

enum Nutanix {
  ClusterList = 'nutanix/clusters.json',
  Cluster = 'nutanix/cluster.json',
  MachineDeploymentList = 'nutanix/machinedeployments.json',
  MachineDeployment = 'nutanix/machinedeployment.json',
}

enum OpenStack {
  ClusterList = 'openstack/clusters.json',
  Cluster = 'openstack/cluster.json',
  MachineDeploymentList = 'openstack/machinedeployments.json',
  MachineDeployment = 'openstack/machinedeployment.json',
}

const Provider = {Alibaba, Anexia, AWS, Azure, BringYourOwn, Digitalocean, Equinix, GCP, Hetzner, Nutanix, OpenStack};
type Provider = typeof Provider;

enum SSHKey {
  List = 'ssh-keys.json',
  Detail = 'ssh-key.json',
}

enum ServiceAccount {
  List = 'service-accounts.json',
  Detail = 'service-account.json',
  TokenList = 'tokens.json',
  Token = 'token.json',
}

enum Project {
  List = 'projects.json',
  Detail = 'project.json',
}

enum Seed {
  List = 'seeds.json',
}

const Resource = {SSHKey, ServiceAccount, Project, Seed};

type Resource = typeof Resource;

const EmptyArray = 'empty-array.json';
const EmptyObject = 'empty-object.json';
const EmptyProjectClusterList = 'empty-project-cluster-list.json';
const Members = 'members.json';
const User = {
  id: 'user-j9e03',
  name: 'roxy',
  creationTimestamp: new Date(),
  isAdmin: false,
  email: 'roxy@kubermatic.io',
  projects: [
    {
      id: 'fn9234fn1d',
      group: 'owners',
    },
  ],
  userSettings: {
    itemsPerPage: 10,
    lastSeenChangelogVersion: 'v9.0.0',
    selectedProjectID: '',
    selectProjectTableView: true,
  },
};
const Settings = {
  User: DEFAULT_USER_SETTINGS,
  Admin: DEFAULT_ADMIN_SETTINGS,
  DatacenterList: 'datacenters.json',
  Datacenter: 'datacenter.json',
};

export const Fixtures = {Provider, Resource, EmptyArray, EmptyObject, EmptyProjectClusterList, User, Members, Settings};
export type Fixtures = typeof Fixtures;
