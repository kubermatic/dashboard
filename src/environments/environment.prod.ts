let redirect_uri = window.location.protocol + '//' + window.location.host +'/login';
let oauth = window.location.protocol + '//' + window.location.host +'/auth';

export const environment = {
  production: true,
  restRoot : "/api/v1",
  digitalOceanRestRoot : "https://api.digitalocean.com/v2",
  coreOSdexAuth : oauth + '?response_type=id_token&client_id=kubermatic&redirect_uri=' + redirect_uri + '&scope=openid&nonce=random',
};
