export const environment = {
  name: 'prod',
  production: true,
  configUrl: '/config/config.json',
  gitVersionUrl: '../assets/config/git-version.json',
  customCSS: '../assets/custom/style.css',
  refreshTimeBase: 1000,  // Unit: ms
  restRoot: '/api/v1',
  oidcProviderUrl: window.location.protocol + '//' + window.location.host + '/dex/auth',
  oidcConnectorId: null,
  animations: true,
};
