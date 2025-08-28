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

export namespace Endpoint {
  export enum Alibaba {
    InstanceTypes = '**/api/**/alibaba/instancetypes',
    VSwitches = '**/api/**/alibaba/vswitches',
    Zones = '**/api/**/alibaba/zones',
  }

  export enum Anexia {
    Templates = '**/api/**/anexia/templates',
    VLANs = '**/api/**/anexia/vlans',
  }

  export enum AWS {
    Sizes = '**/api/**/aws/sizes',
    Subnets = '**/api/**/aws/*/subnets',
  }

  export enum Nutanix {
    Subnets = '**/api/**/nutanix/*/subnets',
  }

  export enum Azure {
    Sizes = '**/api/**/azure/sizes',
  }

  export enum Digitalocean {
    Sizes = '**/api/**/digitalocean/sizes',
  }

  export enum GCP {
    DiskTypes = '**/api/**/gcp/disktypes',
    Sizes = '**/api/**/gcp/sizes',
    Zones = '**/api/**/gcp/*/zones',
  }
  export enum Hetzner {
    Sizes = '**/api/**/hetzner/sizes',
  }

  export enum OpenStack {
    AvailabilityZones = '**/api/**/openstack/availabilityzones',
    Sizes = '**/api/**/openstack/sizes',
  }

  export const CurrentUser = '**/api/*/me';
  export const AdminSettings = '**/api/*/admin/settings';
  export const Seeds = '**/api/*/seed';
  export const SeedSettings = '**/api/*/seeds/*/settings';
  export const Datacenters = '**/api/*/dc';
  export const Presets = '**/api/*/projects/*/providers/*/presets*';
  export const CustomLinks = '**/api/*/admin/settings/customlinks';
  export const Addons = '**/api/*/addons';
  export const AddonConfigs = '**/api/*/addonconfigs';
  export const SystemLabels = '**/api/*/labels/system';
  export const Project = '**/api/*/projects/*';
  export const Projects = '**/api/*/projects*';
  export const Clusters = '**/api/*/projects/*/clusters';
  export const Cluster = '**/api/*/projects/*/clusters/*';
  export const ClusterHealth = '**/api/*/projects/*/clusters/*/health';
  export const ClusterMetrics = '**/api/*/projects/*/clusters/*/metrics';
  export const ClusterNodes = '**/api/*/projects/*/clusters/*/nodes**';
  export const ClusterEvents = '**/api/*/projects/*/clusters/*/events';
  export const ClusterBindings = '**/api/*/projects/*/clusters/*/bindings';
  export const ClusterClusterBindings = '*/api/**/projects/*/clusters/*/clusterbindings';
  export const ClusterRuleGroups = '**/api/*/projects/*/clusters/*/rulegroups';
  export const ClusterAddons = '**/api/*/projects/*/clusters/*/addons';
  export const ClusterSSHKeys = '**/api/*/projects/*/clusters/*/sshkeys';
  export const ClusterSSHKey = '**/api/*/projects/*/clusters/*/sshkeys/*';
  export const ClusterUpgrades = '**/api/*/projects/*/clusters/*/upgrades';
  export const ExternalClusters = '**/api/*/projects/*/kubernetes/clusters';
  export const ExternalCluster = '**/api/*/projects/*/kubernetes/clusters/*';
  export const ExternalClusterNodes = '**/api/*/projects/*/kubernetes/clusters/*/nodes';
  export const ExternalClusterMetrics = '**/api/*/projects/*/kubernetes/clusters/*/metrics';
  export const ExternalClusterNodesMetrics = '**/api/*/projects/*/kubernetes/clusters/*/nodesmetrics';
  export const ExternalClusterEvents = '**/api/*/projects/*/kubernetes/clusters/*/events';
  export const ClusterTemplates = '**/api/*/projects/*/clustertemplates';
  export const ClusterTemplateInstances = '**/api/*/projects/*/clustertemplates/*/instances';
  export const MachineDeployments = '**/api/*/projects/*/clusters/*/machinedeployments';
  export const MachineDeployment = '**/api/*/projects/*/clusters/*/machinedeployments/*';
  export const MachineDeploymentNodes = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes';
  export const MachineDeploymentNodesMetrics = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes/metrics';
  export const MachineDeploymentNodesEvents = '**/api/*/projects/*/clusters/*/machinedeployments/*/nodes/events';
  export const EtcdRestores = '**/api/*/projects/*/etcdrestores';
  export const AlertmanagerConfig = '**/alertmanager/config';
  export const Users = '**/users';
  export const Tokens = '**/tokens';
  export const Members = '**/api/**/users';
  export const ServiceAccounts = '**/serviceaccounts';
  export const ServiceAccount = '**/serviceaccounts/*';
  export const ServiceAccountTokens = '**/serviceaccounts/*/tokens';
  export const SSHKeys = '**/api/**/projects/*/sshkeys';
  export const SSHKey = '**/api/**/projects/*/sshkeys/*';
  export const Administrators = '**/admin';
  export const ConstraintTemplates = '**/constrainttemplates';
  export const ConstraintTemplate = '**/constrainttemplates/*';
  export const DefaultConstraints = '**/constraints';
  export const DefaultConstraint = '**/constraints/*';
  export const Constraints = '**/api/*/projects/*/clusters/*/constraints';
  export const Constraint = '**/api/*/projects/*/clusters/*/constraints/*';
  export const GatekeeperConfig = '**/api/*/projects/*/clusters/*/gatekeeper/config';
  export const AdmissionPlugins = '**/api/**/admission/plugins/*';
  export const Versions = '**/providers/*/versions';
  export const FeatureGates = '**/featuregates';
  export const CNIPluginVersions = '**/cni/*/versions';
}
