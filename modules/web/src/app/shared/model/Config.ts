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

export interface Theme {
  name: string;
  displayName: string;
  isDark: boolean;
}

export type EndOfLife = {[version: string]: string};

export interface ErrorThrottlingConfig {
  initial_delay_minutes?: number;
  max_delay_minutes?: number;
  backoff_multiplier?: number;
  mute_threshold?: number;
  mute_reset_hours?: number;
  cleanup_interval_minutes?: number;
  entry_expiration_hours?: number;
  enable_throttling?: boolean;
  enable_auto_mute?: boolean;
}

export interface Config {
  openstack?: {
    wizard_use_default_user?: boolean;
    wizard_default_domain_name?: string;
  };
  google_analytics_code?: string;
  google_analytics_config?: object;
  oidc_provider?: string;
  oidc_provider_url?: string;
  oidc_provider_scope?: string;
  oidc_provider_client_id?: string;
  oidc_connector_id?: string;
  oidc_logout_url?: string;
  themes?: Theme[];
  enforced_theme?: string;
  end_of_life?: EndOfLife;
  postfix_page_title?: string;
  error_throttling?: ErrorThrottlingConfig;
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
  groups?: Groups;
  sshkeys?: SSHKeys;
  clusters?: Clusters;
  nodes?: Nodes;
  machineDeployments?: MachineDeployments;
  serviceaccounts?: ServiceAccounts;
  serviceaccountToken?: ServiceAccountToken;
  rbac?: RBAC;
  backups?: Backups;
  clusterbackups?: ClusterBackupsConfig;
  kyvernoPolicies?: KyvernoPoliciesConfig;
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

export class Groups implements Viewable {
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

export class MachineDeployments implements Viewable {
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

export class Backups implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class ClusterBackupsConfig implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}

export class KyvernoPoliciesConfig implements Viewable {
  view?: boolean;
  edit?: boolean;
  create?: boolean;
  delete?: boolean;
}
export enum OIDCProviders {
  Keycloak = 'keycloak',
}
