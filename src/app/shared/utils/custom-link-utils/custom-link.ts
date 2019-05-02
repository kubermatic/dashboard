export class CustomLink {
  label: string;
  url: string;
  icon?: CustomLinkIcon|string;
  location?: CustomLinkLocation;

  static getIcon(link: CustomLink): string {
    return link.icon && link.icon.length > 0 ? link.icon : CustomLink._findMatchingServiceIcon(link);
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
    } else {
      return CustomLinkIcon.Default;
    }
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
  Footer = 'footer'
}
