let redirect_uri = window.location.protocol + '//' + window.location.host;
let oauth = window.location.protocol + '//' + window.location.host +'/dex/auth';
let scope: string[] = ["openid", "email", "profile", "groups"];

export const environment = {
  production: true,
  restRoot : "/api/v1",
  digitalOceanRestRoot : "https://api.digitalocean.com/v2",
  coreOSdexAuth : oauth + '?response_type=id_token&client_id=kubermatic&redirect_uri=' + redirect_uri + '&scope='+ scope.join(" ") +'&nonce=random',
};
