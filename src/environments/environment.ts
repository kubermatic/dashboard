// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

let redirect_uri = window.location.protocol + '//' + window.location.host +'/login';
let coreOS_auth_host = "auth.int.kubermatic.io";

export const environment = {
  production: false,
  restRoot : "/api/v1",
  digitalOceanRestRoot : "https://api.digitalocean.com/v2",
  coreOSdexAuth : 'https://' + coreOS_auth_host + '/auth?response_type=id_token&client_id=kubermatic&redirect_uri=' + redirect_uri + '&scope=openid&nonce=random',
};
