// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as _ from 'lodash';

export class UserSettings {
  selectedTheme?: string;
  selectedProjectId?: string;
  itemsPerPage?: number;
  selectProjectTableView?: boolean;
  collapseSidenav?: boolean;
  displayAllProjectsForAdmin?: boolean;
  lastSeenChangelogVersion?: string;
}

export class AdminSettings {
  cleanupOptions: CleanupOptions;
  customLinks: CustomLink[];
  defaultNodeCount: number;
  displayAPIDocs: boolean;
  displayDemoInfo: boolean;
  displayTermsOfService: boolean;
  enableDashboard: boolean;
  enableOIDCKubeconfig: boolean;
  userProjectsLimit: number;
  restrictProjectCreation: boolean;
  enableExternalClusterImport: boolean;
  machineDeploymentVMResourceQuota: MachineDeploymentVMResourceQuota;
  opaOptions: OpaOptions;
  mlaOptions: MLAOptions;
  mlaAlertmanagerPrefix: string;
}

export class MachineDeploymentVMResourceQuota {
  minCPU: number;
  maxCPU: number;
  minRAM: number;
  maxRAM: number;
  enableGPU: boolean;
}

export class CleanupOptions {
  Enabled: boolean;
  Enforced: boolean;
}

export class OpaOptions {
  enabled: boolean;
  enforced: boolean;
}

export class MLAOptions {
  loggingEnabled: boolean;
  loggingEnforced: boolean;
  monitoringEnabled: boolean;
  monitoringEnforced: boolean;
}

export class CustomLink {
  label: string;
  url: string;
  icon?: CustomLinkIcon | string;
  location?: CustomLinkLocation;

  static getIcon(link: CustomLink): string {
    return !_.isEmpty(link.icon) ? link.icon : CustomLink._findMatchingServiceIcon(link);
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
  cleanupOptions: {
    Enforced: false,
    Enabled: false,
  },
  userProjectsLimit: 0,
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableOIDCKubeconfig: false,
  restrictProjectCreation: false,
  enableExternalClusterImport: true,
  machineDeploymentVMResourceQuota: {
    minRAM: 0,
    maxRAM: 0,
    minCPU: 0,
    maxCPU: 0,
    enableGPU: false,
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
};
