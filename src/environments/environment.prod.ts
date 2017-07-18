let port = ((window.location.port != "80" && window.location.port != "443") ? ':'+window.location.port : "");
let redirect_uri = window.location.protocol + '//' + window.location.host +'/login';
let coreOS_auth_host = "auth.int.kubermatic.io";


export const environment = {
  production: true,
  restRoot : "/api/v1",
  digitalOceanRestRoot : "https://api.digitalocean.com/v2",
  coreOSdexAuth : 'https://' + coreOS_auth_host + '/auth?response_type=id_token&client_id=kubermatic&redirect_uri=' + redirect_uri + '&scope=openid&nonce=random',
};
