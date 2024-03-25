// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

enum Alibaba {
  InstanceTypes = '**/api/**/alibaba/instancetypes',
  VSwitches = '**/api/**/alibaba/vswitches',
  Zones = '**/api/**/alibaba/zones',
}

enum Anexia {
  Templates = '**/api/**/anexia/templates',
  VLANs = '**/api/**/anexia/vlans',
}

enum AWS {
  Sizes = '**/api/**/aws/sizes',
  Subnets = '**/api/**/aws/*/subnets',
}

enum Azure {
  Sizes = '**/api/**/azure/sizes',
}

enum Digitalocean {
  Sizes = '**/api/**/digitalocean/sizes',
}

enum Equinix {
  Sizes = '**/api/**/equinixmetal/sizes',
}

enum GCP {
  DiskTypes = '**/api/**/gcp/disktypes',
  Sizes = '**/api/**/gcp/sizes',
  Zones = '**/api/**/gcp/*/zones',
}

enum Hetzner {
  Sizes = '**/api/**/hetzner/sizes',
}

enum Nutanix {
  Subnets = '**/api/**/nutanix/*/subnets',
}

enum OpenStack {
  AvailabilityZones = '**/api/**/openstack/availabilityzones',
  Sizes = '**/api/**/openstack/sizes',
}

const Provider = {Alibaba, Anexia, AWS, Azure, Digitalocean, Equinix, GCP, Hetzner, Nutanix, OpenStack};
type Provider = typeof Provider;

enum Cluster {
  Create = '**/api/*/projects/*/clusters',
  List = '**/api/*/projects/*/clusters?show_dm_count=*',
  Detail = '**/api/*/projects/*/clusters/*',
  Health = '**/api/*/projects/*/clusters/*/health',
  Metrics = '**/api/*/projects/*/clusters/*/metrics',
  Nodes = '**/api/*/projects/*/clusters/*/nodes**',
  Events = '**/api/*/projects/*/clusters/*/events',
  Bindings = '**/api/*/projects/*/clusters/*/bindings',
  ClusterBindings = '*/api/**/projects/*/clusters/*/clusterbindings',
  RuleGroups = '**/api/*/projects/*/clusters/*/rulegroups',
  Addons = '**/api/*/projects/*/clusters/*/addons',
  SSHKeyList = '**/api/*/projects/*/clusters/*/sshkeys',
  SSHKey = '**/api/*/projects/*/clusters/*/sshkeys/*',
  Upgrades = '**/api/*/projects/*/clusters/*/upgrades',
  ConstraintList = '**/api/*/projects/*/clusters/*/constraints',
  Constraint = '**/api/*/projects/*/clusters/*/constraints/*',
  GatekeeperConfig = '**/api/*/projects/*/clusters/*/gatekeeper/config',
}

enum ClusterTemplate {
  List = '**/api/*/projects/*/clustertemplates',
  Instances = '**/api/*/projects/*/clustertemplates/*/instances',
}

enum Constraint {
  List = '**/constraints',
  Detail = '**/constraints/*',
  TemplateList = '**/constrainttemplates',
  Template = '**/constrainttemplates/*',
}

enum Datacenter {
  List = '**/api/*/dc',
  Create = '**/api/*/seed/*/dc',
  Delete = '**/api/*/seed/*/dc/*',
}

enum EtcdRestore {
  List = '**/api/*/projects/*/etcdrestores',
}

enum ExternalCluster {
  List = '**/api/*/projects/*/kubernetes/clusters',
  Detail = '**/api/*/projects/*/kubernetes/clusters/*',
  Nodes = '**/api/*/projects/*/kubernetes/clusters/*/nodes',
  Metrics = '**/api/*/projects/*/kubernetes/clusters/*/metrics',
  NodesMetrics = '**/api/*/projects/*/kubernetes/clusters/*/nodesmetrics',
  Events = '**/api/*/projects/*/kubernetes/clusters/*/events',
}

enum MachineDeployment {
  List = '**/api/*/projects/*/clusters/*/machinedeployments',
  Detail = '**/api/*/projects/*/clusters/*/machinedeployments/*',
  Nodes = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes',
  NodesMetrics = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes/metrics',
  NodesEvents = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes/events',
}

enum Preset {
  List = '**/api/*/providers/*/presets*',
}

enum Project {
  List = '**/api/*/projects*',
  Detail = '**/api/*/projects/*',
}

enum Seed {
  List = '**/api/*/seed',
  Settings = '**/api/*/seeds/*/settings',
}

enum ServiceAccount {
  List = '**/serviceaccounts',
  Detail = '**/serviceaccounts/*',
  Tokens = '**/serviceaccounts/*/tokens',
}

enum SSHKey {
  List = '**/api/**/projects/*/sshkeys',
  Detail = '**/api/**/projects/*/sshkeys/*',
}

const Resource = {
  Cluster,
  ClusterTemplate,
  Constraint,
  Datacenter,
  EtcdRestore,
  ExternalCluster,
  MachineDeployment,
  Preset,
  Project,
  Seed,
  ServiceAccount,
  SSHKey,
};
type Resource = typeof Resource;

enum Administrator {
  Settings = '**/api/*/admin/settings',
  CustomLinks = '**/api/*/admin/settings/customlinks',
  List = '**/admin',
}

enum User {
  List = '**/users',
  Me = '**/api/*/me',
}

const AddonConfigs = '**/api/*/addonconfigs';
const Addons = '**/api/*/addons';
const AdmissionPlugins = '**/api/**/admission/plugins/*';
const AlertmanagerConfig = '**/alertmanager/config';
const Members = '**/api/**/users';
const SystemLabels = '**/api/*/labels/system';
const Tokens = '**/tokens';
const Versions = '**/providers/*/versions';

export const Endpoints = {
  Provider,
  Resource,
  Administrator,
  User,
  AddonConfigs,
  Addons,
  AdmissionPlugins,
  AlertmanagerConfig,
  Members,
  SystemLabels,
  Tokens,
  Versions,
};
export type Endpoints = typeof Endpoints;
