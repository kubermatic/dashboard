// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses 'environment.ts', but if you do
// 'ng build --env=prod' then 'environment.prod.ts' will be used instead.
// The list of which env maps to which file can be found in 'angular-cli.json'.

export const environment = {
  name: 'dev',
  production: false,
  configUrl: '../../assets/config/config.json',
  gitVersionUrl: '../../assets/config/git-version.json',
  customCSS: '../../assets/custom/style.css',
  refreshTimeBase: 1000,  // Unit: ms
  restRoot: 'api/v1',
  restRootV3: 'api/v3',
  digitalOceanRestRoot: 'https://api.digitalocean.com/v2',
  oidcProviderUrl: 'https://dev.kubermatic.io/dex/auth',
  animations: true,
};
