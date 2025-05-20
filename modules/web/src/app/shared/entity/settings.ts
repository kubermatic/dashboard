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

import {QuotaVariables} from '@shared/entity/quota';
import _ from 'lodash';

export interface UserSettings {
  selectedTheme?: string;
  selectedProjectID?: string;
  itemsPerPage?: number;
  selectProjectTableView?: boolean;
  collapseSidenav?: boolean;
  displayAllProjectsForAdmin?: boolean;
  lastSeenChangelogVersion?: string;
  useClustersView?: boolean;
}

export interface AdminSettings {
  cleanupOptions: CleanupOptions;
  customLinks: CustomLink[];
  defaultNodeCount: number;
  displayAPIDocs: boolean;
  displayDemoInfo: boolean;
  displayTermsOfService: boolean;
  enableDashboard: boolean;
  enableWebTerminal: boolean;
  enableShareCluster: boolean;
  enableOIDCKubeconfig: boolean;
  disableAdminKubeconfig: boolean;
  userProjectsLimit: number;
  restrictProjectCreation: boolean;
  restrictProjectDeletion: boolean;
  enableExternalClusterImport: boolean;
  machineDeploymentVMResourceQuota: MachineDeploymentVMResourceQuota;
  opaOptions: OpaOptions;
  mlaOptions: MLAOptions;
  mlaAlertmanagerPrefix: string;
  mlaGrafanaPrefix: string;
  enableClusterBackups?: boolean;
  enableEtcdBackup?: boolean;
  notifications?: NotificationOptions;
  providerConfiguration?: ProviderConfiguration;
  defaultQuota?: DefaultProjectQuota;
  machineDeploymentOptions: MachineDeploymentOptions;
  allowedOperatingSystems?: AllowedOperatingSystems;
  disableChangelogPopup?: boolean;
  webTerminalOptions?: WebTerminalOptions;
  staticLabels?: StaticLabel[];
  annotations?: AdminSettingsAnnotations;
  // the Object type is used when we send the announcements to the API
  announcements?: Map<string, AdminAnnouncement> | Object;
  clusterBackupOptions?: ClusterBackupOptions;
}

export interface AdminSettingsAnnotations {
  hiddenAnnotations?: string[];
  protectedAnnotations?: string[];
}

export interface AdminAnnouncement {
  isActive: boolean;
  message: string;
  createdAt?: string;
  expires?: string;
}

export interface ClusterBackupOptions {
  defaultChecksumAlgorithm: string;
}

export interface StaticLabel {
  key: string;
  values: string[];
  default: boolean;
  protected: boolean;
}

export interface WebTerminalOptions {
  enabled?: boolean;
  enableInternetAccess?: boolean;
  // This is not used/handled by the frontend so it's safe to use unknown
  additionalEnvironmentVariables?: unknown;
}

export interface MachineDeploymentVMResourceQuota {
  minCPU: number;
  maxCPU: number;
  minRAM: number;
  maxRAM: number;
  enableGPU: boolean;
}

export interface AllowedOperatingSystems {
  ubuntu?: boolean;
  amzn2?: boolean;
  rhel?: boolean;
  flatcar?: boolean;
  rockylinux?: boolean;
}

export interface CleanupOptions {
  enabled: boolean;
  enforced: boolean;
}

export interface OpaOptions {
  enabled: boolean;
  enforced: boolean;
}

export interface MLAOptions {
  loggingEnabled: boolean;
  loggingEnforced: boolean;
  monitoringEnabled: boolean;
  monitoringEnforced: boolean;
}

export interface NotificationOptions {
  hideErrors: boolean;
  hideErrorEvents: boolean;
}

export interface ProviderConfiguration {
  openStack?: OpenStack;
  vmwareCloudDirector?: VMwareCloudDirector;
}

export interface VMwareCloudDirector {
  ipAllocationModes: string[];
}

export interface OpenStack {
  enforceCustomDisk: boolean;
}

export interface DefaultProjectQuota {
  description?: string;
  quota: QuotaVariables;
}

export interface MachineDeploymentOptions {
  autoUpdatesEnabled: boolean;
  autoUpdatesEnforced: boolean;
}

export class CustomLink {
  label = '';
  url = '';
  icon?: CustomLinkIcon | string;
  location?: CustomLinkLocation;

  static getIcon(link: CustomLink): string {
    return !_.isEmpty(link.icon) ? link.icon! : CustomLink._findMatchingServiceIcon(link);
  }

  private static _findMatchingServiceIcon(link: CustomLink): CustomLinkIcon {
    if (CustomLink._isMatching(link, 'github')) {
      return CustomLinkIcon.GitHub;
    } else if (CustomLink._isMatching(link, 'grafana')) {
      return CustomLinkIcon.Grafana;
    } else if (CustomLink._isMatching(link, 'kibana')) {
      return CustomLinkIcon.Kibana;
    } else if (CustomLink._isMatching(link, 'prometheus')) {
      return CustomLinkIcon.Prometheus;
    } else if (CustomLink._isMatching(link, 'slack')) {
      return CustomLinkIcon.Slack;
    } else if (CustomLink._isMatching(link, 'twitter')) {
      return CustomLinkIcon.Twitter;
    } else if (CustomLink._isMatching(link, 'jfrog')) {
      return CustomLinkIcon.JFrog;
    }
    return CustomLinkIcon.Default;
  }

  private static _isMatching(link: CustomLink, service: string): boolean {
    return link.label.toLowerCase().includes(service) || link.url.toLowerCase().includes(service);
  }
}

export enum CustomLinkIcon {
  Default = '/assets/images/icons/custom/default.svg',
  GitHub = '/assets/images/icons/custom/github.svg',
  Grafana = '/assets/images/icons/custom/grafana.svg',
  JFrog = '/assets/images/icons/custom/jfrog.svg',
  Kibana = '/assets/images/icons/custom/kibana.svg',
  Prometheus = '/assets/images/icons/custom/prometheus.svg',
  Slack = '/assets/images/icons/custom/slack.svg',
  Twitter = '/assets/images/icons/custom/twitter.svg',
}

export enum CustomLinkLocation {
  Default = 'default',
  Footer = 'footer',
  HelpPanel = 'panel',
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  itemsPerPage: 10,
  selectProjectTableView: false,
  collapseSidenav: false,
  displayAllProjectsForAdmin: false,
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  allowedOperatingSystems: {
    ubuntu: true,
    amzn2: true,
    rhel: true,
    flatcar: true,
    rockylinux: true,
  },
  cleanupOptions: {
    enforced: false,
    enabled: false,
  },
  userProjectsLimit: 0,
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableWebTerminal: false,
  enableShareCluster: false,
  disableAdminKubeconfig: false,
  enableOIDCKubeconfig: false,
  enableClusterBackups: false,
  enableEtcdBackup: false,
  restrictProjectCreation: false,
  restrictProjectDeletion: false,
  enableExternalClusterImport: true,
  machineDeploymentVMResourceQuota: {
    minRAM: 0,
    maxRAM: 0,
    minCPU: 0,
    maxCPU: 0,
    enableGPU: false,
  },
  machineDeploymentOptions: {
    autoUpdatesEnabled: false,
    autoUpdatesEnforced: false,
  },
  opaOptions: {
    enforced: false,
    enabled: false,
  },
  mlaOptions: {
    loggingEnforced: false,
    loggingEnabled: false,
    monitoringEnforced: false,
    monitoringEnabled: false,
  },
  mlaAlertmanagerPrefix: '',
  mlaGrafanaPrefix: '',
  providerConfiguration: {
    openStack: {
      enforceCustomDisk: false,
    },
    vmwareCloudDirector: {
      ipAllocationModes: ['DHCP', 'POOL'],
    },
  },
  defaultQuota: {
    quota: {},
  },
  disableChangelogPopup: false,
  webTerminalOptions: {
    enabled: false,
  },
};
