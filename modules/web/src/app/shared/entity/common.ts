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

export class Metadata {
  name?: string;
  selfLink?: string;
  uid?: string;
  annotations?: Map<string, string>;
  creationTimestamp?: Date;
  labels?: Map<string, string>;
  deletionTimestamp?: Date;
}

export class ObjectReference {
  name: string;
  namespace: string;
  type: string;
}

export enum ResourceType {
  Cluster = 'cluster',
  Project = 'project',
  MachineDeployment = 'nodedeployment',
}

export type ResourceLabelMap = {
  [key in ResourceType]: string[];
};

export enum View {
  Overview = 'overview',
  Clusters = 'clusters',
  ExternalClusters = 'externalclusters',
  KubeOneClusters = 'kubeoneclusters',
  ClusterTemplates = 'clustertemplates',
  Projects = 'projects',
  Members = 'members',
  Groups = 'groups',
  SSHKeys = 'sshkeys',
  ServiceAccounts = 'serviceaccounts',
  Wizard = 'wizard',
  ExternalClusterWizard = 'external-cluster-wizard',
  KubeOneWizard = 'kubeone-wizard',
  Account = 'account',
  Settings = 'settings',
  MachineDeployment = 'md',
  Backups = 'backups',
  Snapshots = 'snapshots',
  Restores = 'restores',
  ClusterBackup = 'clusterbackups',
  ClusterSchedule = 'clusterschedules',
  ClusterRestore = 'clusterrestores',
  BackupStorageLocation = 'backupstoragelocations',
  Access = 'access',
  RestAPI = 'rest-api',
  SignIn = 'signIn',
}

// IMPORTANT: names in 'ViewDisplayName' have to be in sync with names in 'View'
export enum ViewDisplayName {
  Overview = 'Overview',
  Clusters = 'Clusters',
  ExternalClusters = 'External Clusters',
  KubeOneClusters = 'KubeOne Clusters',
  ClusterTemplates = 'Cluster Templates',
  Projects = 'Projects',
  Members = 'Members',
  Groups = 'Groups',
  SSHKeys = 'SSH Keys',
  ServiceAccounts = 'Service Accounts',
  Wizard = 'Wizard',
  Account = 'User Settings',
  Settings = 'Admin Panel',
  MachineDeployment = 'Machine Deployment',
  Backups = 'Backups',
  Snapshots = 'Snapshots',
  Restores = 'Restores',
  ClusterBackup = 'Cluster Backups',
  ClusterSchedule = 'Cluster Schedules',
  ClusterRestore = 'Cluster Restores',
  BackupStorageLocation = 'Backup Storage Locations',
  Access = 'Access',
  RestAPI = 'Rest API',
  SignIn = 'SignIn',
}

export enum ProjectSidenavSection {
  Resources = 'Resources',
  Backups = 'etcd Backups',
  ClusterBackups = 'Cluster Backups',
  Access = 'Access',
}

export enum AdminPanelView {
  Defaults = 'defaults',
  Limits = 'limits',
  Customization = 'customization',
  SeedConfiguration = 'seeds',
  Datacenters = 'datacenters',
  ProviderPresets = 'presets',
  BackupDestinations = 'backupdestinations',
  ProjectQuotas = 'quotas',
  OPA = 'opa',
  RuleGroups = 'rulegroups',
  Metering = 'metering',
  Accounts = 'accounts',
  Administrators = 'administrators',
  Applications = 'applications',
  Announcement = 'announcement',
}

export enum AdminPanelViewDisplayName {
  Defaults = 'Defaults',
  Limits = 'Limits',
  Customization = 'Customization',
  Datacenters = 'Datacenters',
  SeedConfiguration = 'Seed Configuration',
  ProviderPresets = 'Provider Presets',
  BackupDestinations = 'Backup Destinations',
  ProjectQuotas = 'Project Quotas',
  OPA = 'Open Policy Agent',
  RuleGroups = 'Rule Groups',
  Metering = 'Metering',
  Accounts = 'Accounts',
  Administrators = 'Administrators',
  Applications = 'Applications',
  Announcement = 'Announcement',
}

export enum AdminPanelSections {
  Interface = 'Interface',
  ManageResources = 'Manage Resources',
  Monitoring = 'Monitoring',
  Users = 'Users',
}

export function getViewDisplayName(viewName: string): string {
  const view: View = Object.values(View).find(view => view === viewName);
  if (!view) {
    return '';
  }

  const viewKey = Object.keys(View).find(viewKey => View[viewKey] === view);
  return ViewDisplayName[viewKey] ? ViewDisplayName[viewKey] : '';
}
