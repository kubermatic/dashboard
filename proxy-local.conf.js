// In current setup every call will be going through the proxy.
//
// More information:
// - https://github.com/angular/angular-cli/blob/master/docs/documentation/stories/proxy.md
// - https://github.com/chimurai/http-proxy-middleware#http-proxy-options

const PROXY_CONFIG = [
  {
    context: [
      "/api/**",
    ],
    target: "http://localhost:8080",
    changeOrigin: true,
    secure: false,
  }
];

module.exports = PROXY_CONFIG;
