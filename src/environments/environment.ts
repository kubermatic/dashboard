// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

const redirect_uri = window.location.protocol + '//' + window.location.host + '/clusters';
const oauth = 'https://dev.kubermatic.io/dex/auth';
const scope: string[] = ['openid', 'email', 'profile', 'groups'];

export const environment = {
  name: 'dev',
  production: false,
  restRoot : 'api/v1',
  restRootV3 : 'api/v3',
  digitalOceanRestRoot : 'https://api.digitalocean.com/v2',
  coreOSdexAuth : oauth + '?response_type=id_token&client_id=kubermatic&redirect_uri='
  + redirect_uri + '&scope=' + scope.join(' ') + '&nonce=random',
};
