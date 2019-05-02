import {CustomLink} from '../entity/CustomLinks';

export interface Config {
  default_node_count?: number;
  show_demo_info?: boolean;
  show_terms_of_service?: boolean;
  share_kubeconfig?: boolean;
  openstack?: {wizard_use_default_user?: boolean;};
  google_analytics_code?: string;
  google_analytics_config?: object;
  cleanup_cluster?: boolean;
  custom_links?: CustomLink[];
  oidc_provider_url?: string;
}

export interface UserGroupConfig {
  owners?: GroupConfig;
  editors?: GroupConfig;
  viewers?: GroupConfig;
}

export class GroupConfig {
  projects?: Projects;
  members?: Members;
  sshKeys?: SSHKeys;
  clusters?: Clusters;
  nodes?: Nodes;
  nodeDeployments?: NodeDeployments;
}

export class Projects {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Members {
  view?: boolean;
  edit?: boolean;
  remove?: boolean;
  invite?: boolean;
}

export class SSHKeys {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Clusters {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class Nodes {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class NodeDeployments {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}
