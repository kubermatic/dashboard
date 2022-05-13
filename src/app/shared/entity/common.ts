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
  ClusterTemplates = 'clustertemplates',
  Projects = 'projects',
  Members = 'members',
  SSHKeys = 'sshkeys',
  ServiceAccounts = 'serviceaccounts',
  Wizard = 'wizard',
  Account = 'account',
  Settings = 'settings',
  MachineDeployment = 'md',
  Backups = 'backups',
}

// IMPORTANT: names in 'ViewDisplayName' have to be in sync with names in 'View'
export enum ViewDisplayName {
  Clusters = 'Clusters',
  ClusterTemplates = 'Cluster Templates',
  Projects = 'Projects',
  Members = 'Members',
  SSHKeys = 'SSH Keys',
  ServiceAccounts = 'Service Accounts',
  Wizard = 'Wizard',
  Account = 'User Settings',
  Settings = 'Admin Panel',
  MachineDeployment = 'Machine Deployment',
  Backups = 'Backups',
}

export function getViewDisplayName(viewName: string): string {
  const view: View = Object.values(View).find(view => view === viewName);
  if (!view) {
    return '';
  }

  const viewKey = Object.keys(View).find(viewKey => View[viewKey] === view);
  return ViewDisplayName[viewKey] ? ViewDisplayName[viewKey] : '';
}
