export class CustomLink {
  label: string;
  url: string;
  icon?: CustomLinkIcon;
}

export enum CustomLinkIcon {
  Default = 'default',
  GitHub = 'github',
  Grafana = 'grafana',
  Kibana = 'kibana',
  Prometheus = 'prometheus',
  Slack = 'slack',
}

export const CUSTOM_LINK_ICON_CLASS_PREFIX = 'km-custom-icon-';
