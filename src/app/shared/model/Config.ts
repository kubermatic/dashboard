export interface Config {
  disable_themes?: boolean;
  share_kubeconfig?: boolean;
  openstack?: {wizard_use_default_user?: boolean};
  google_analytics_code?: string;
  google_analytics_config?: object;
  oidc_provider_url?: string;
  oidc_provider_scope?: string;
  oidc_provider_client_id?: string;
  oidc_connector_id?: string;
}

export interface UserGroupConfig {
  owners?: GroupConfig;
  editors?: GroupConfig;
  viewers?: GroupConfig;
}

export interface Viewable {
  view?: boolean;
}

export class GroupConfig {
  projects?: Projects;
  members?: Members;
  sshKeys?: SSHKeys;
  clusters?: Clusters;
  nodes?: Nodes;
  nodeDeployments?: NodeDeployments;
  serviceaccounts?: ServiceAccounts;
  serviceaccountToken?: ServiceAccountToken;
  rbac?: RBAC;
}

export class Projects implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Members implements Viewable {
  view?: boolean;
  edit?: boolean;
  delete?: boolean;
  create?: boolean;
}

export class SSHKeys implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Clusters implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Nodes implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class NodeDeployments implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class ServiceAccounts implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class ServiceAccountToken implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class RBAC implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}
