export class CustomLink {
  label: string;
  url: string;
  icon?: CustomLinkIcon|string;
  location?: CustomLinkLocation;
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

export function getCustomIcon(customLink: CustomLink): string {
  return customLink.icon && customLink.icon.length > 0 ? customLink.icon : findMatchingServiceIcon(customLink);
}

export function findMatchingServiceIcon(customLink: CustomLink) {
  if (isMatching(customLink, 'github')) {
    return CustomLinkIcon.GitHub;
  } else if (isMatching(customLink, 'grafana')) {
    return CustomLinkIcon.Grafana;
  } else if (isMatching(customLink, 'kibana')) {
    return CustomLinkIcon.Kibana;
  } else if (isMatching(customLink, 'prometheus')) {
    return CustomLinkIcon.Prometheus;
  } else if (isMatching(customLink, 'slack')) {
    return CustomLinkIcon.Slack;
  } else if (isMatching(customLink, 'twitter')) {
    return CustomLinkIcon.Twitter;
  } else if (isMatching(customLink, 'jfrog')) {
    return CustomLinkIcon.JFrog;
  } else {
    return CustomLinkIcon.Default;
  }
}

function isMatching(customLink: CustomLink, service: string) {
  return customLink.label.toLowerCase().includes(service) || customLink.url.toLowerCase().includes(service);
}
