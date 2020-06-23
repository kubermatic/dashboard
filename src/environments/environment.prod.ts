const host = window.location.host.replace(/\/+$/, '');
const protocol = window.location.protocol;
const wsProtocol = protocol.replace('http', 'ws');

export const environment = {
  name: 'prod',
  production: true,
  configUrl: '/config/config.json',
  gitVersionUrl: '../assets/config/version.json',
  refreshTimeBase: 1000, // Unit: ms
  restRoot: '/api/v1',
  wsRoot: `${wsProtocol}//${host}/api/v1/ws`,
  oidcProviderUrl: `${protocol}//${host}/dex/auth`,
  oidcConnectorId: null,
  animations: true,
};
