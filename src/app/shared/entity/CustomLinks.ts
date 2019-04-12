export class CustomLink {
  label: string;
  url: string;
  icon?: CustomLinkIcon;
}

export enum CustomLinkIcon {
  Default = '/assets/images/icons/custom/default.svg',
  GitHub = '/assets/images/icons/custom/github.svg',
  Grafana = '/assets/images/icons/custom/grafana.svg',
  Kibana = '/assets/images/icons/custom/kibana.svg',
  Prometheus = '/assets/images/icons/custom/prometheus.svg',
  Slack = '/assets/images/icons/custom/slack.svg',
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
  } else {
    return CustomLinkIcon.Default;
  }
}

function isMatching(customLink: CustomLink, service: string) {
  return customLink.label.includes(service) || customLink.url.includes(service);
}
