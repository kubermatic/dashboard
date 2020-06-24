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

export function getViewDisplayName(view: string): string {
  switch (view) {
    case View.Clusters:
      return ViewDisplayName.Clusters;
    case View.Members:
      return ViewDisplayName.Members;
    case View.ServiceAccounts:
      return ViewDisplayName.ServiceAccounts;
    case View.SSHKeys:
      return ViewDisplayName.SSHKeys;
    case View.Wizard:
      return ViewDisplayName.Wizard;
    case View.Projects:
      return ViewDisplayName.Projects;
    case View.Account:
      return ViewDisplayName.Account;
    case View.Settings:
      return ViewDisplayName.Settings;
    case View.NodeDeployment:
      return ViewDisplayName.NodeDeployment;
    default:
      return '';
  }
}
