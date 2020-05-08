// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses 'environment.ts', but if you do
// 'ng build --env=prod' then 'environment.prod.ts' will be used instead.
// The list of which env maps to which file can be found in 'angular-cli.json'.

const host = window.location.host.replace(/\/+$/, '');
const protocol = window.location.protocol;
const wsProtocol = protocol.replace('http', 'ws');

export const environment = {
  name: 'dev',
  production: false,
  configUrl: '../../assets/config/config.json',
  gitVersionUrl: '../../assets/config/git-version.json',
  customCSS: '../../assets/custom/style.css',
  refreshTimeBase: 1000, // Unit: ms
  restRoot: 'api/v1',
  wsRoot: `${wsProtocol}//${host}/api/v1/ws`,
  oidcProviderUrl: 'https://dev.kubermatic.io/dex/auth',
  oidcConnectorId: null,
  animations: true,
};
