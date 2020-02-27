const host = window.location.host.replace(/\/+$/, '');
const protocol = window.location.protocol;
const wsProtocol = protocol.replace('http', 'ws');

export const environment = {
  name: 'dev',
  production: false,
  configUrl: '../../assets/config/config.json',
  gitVersionUrl: '../../assets/config/git-version.json',
  customCSS: '../../assets/custom/style.css',
  refreshTimeBase: 1000,  // Unit: ms
  restRoot: 'api/v1',
  wsRoot: `${wsProtocol}//${host}/api/v1/ws`,
  oidcProviderUrl: 'https://dev.kubermatic.io/dex/auth',
  oidcConnectorId: 'local',
  animations: false,
};
