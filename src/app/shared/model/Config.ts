export interface Config {
    show_demo_info?: boolean;
    openstack?: {
        wizard_use_default_user?: boolean;
    };
    google_analytics_code?: string;
    google_analytics_config?: object;
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
  create?: boolean;
  delete?: boolean;
}
