import * as _ from 'lodash';

export class UserSettings {
  selectedTheme?: string;
  selectedProjectId?: string;
  itemsPerPage?: number;
  selectProjectTableView?: boolean;
  collapseSidenav?: boolean;
  displayAllProjectsForAdmin?: boolean;
}

export class AdminSettings {
  cleanupOptions: CleanupOptions;
  clusterTypeOptions: ClusterTypeOptions;
  customLinks: CustomLink[];
  defaultNodeCount: number;
  displayAPIDocs: boolean;
  displayDemoInfo: boolean;
  displayTermsOfService: boolean;
  enableDashboard: boolean;
  enableOIDCKubeconfig: boolean;
}

export class CleanupOptions {
  Enabled: boolean;
  Enforced: boolean;
}

export enum ClusterTypeOptions {
  All = 0,
  Kubernetes = 1,
  OpenShift = 2,
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
}

export function filterCustomLinks(links: CustomLink[], location?: CustomLinkLocation): CustomLink[] {
  return links.filter(link => {
    // Return all links if the location param is not specified.
    return (
      !location ||
      // Return link if location does match.
      location === link.location ||
      // Return link if default location was specified and link config is missing or is invalid.
      (location === CustomLinkLocation.Default && !Object.values(CustomLinkLocation).includes(link.location))
    );
  });
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
  clusterTypeOptions: ClusterTypeOptions.All,
  customLinks: [],
  defaultNodeCount: 1,
  displayAPIDocs: true,
  displayDemoInfo: false,
  displayTermsOfService: false,
  enableDashboard: true,
  enableOIDCKubeconfig: false,
};
