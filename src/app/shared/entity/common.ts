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
  NodeDeployment = 'nodedeployment',
}

export type ResourceLabelMap = {
  [key in ResourceType]: string[];
};

export enum View {
  Clusters = 'clusters',
  Projects = 'projects',
  Members = 'members',
  SSHKeys = 'sshkeys',
  ServiceAccounts = 'serviceaccounts',
  Wizard = 'wizard',
  Account = 'account',
  Settings = 'settings',
  NodeDeployment = 'nd',
}

// IMPORTANT: names in 'ViewDisplayName' have to be in sync with names in 'View'
export enum ViewDisplayName {
  Clusters = 'Clusters',
  Projects = 'Projects',
  Members = 'Members',
  SSHKeys = 'SSH Keys',
  ServiceAccounts = 'Service Accounts',
  Wizard = 'Wizard',
  Account = 'User Settings',
  Settings = 'Admin Panel',
  NodeDeployment = 'Node Deployment',
}

export function getViewDisplayName(viewName: string): string {
  const view: View = Object.values(View).find(view => view === viewName);
  if (!view) {
    return '';
  }

  const viewKey = Object.keys(View).find(viewKey => View[viewKey] === view);
  return ViewDisplayName[viewKey] ? ViewDisplayName[viewKey] : '';
}
