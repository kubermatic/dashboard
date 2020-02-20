// TODO Fix:
//  https://github.com/angular/angular-cli/blob/master/docs/documentation/stories/proxy.md
//  https://github.com/chimurai/http-proxy-middleware#http-proxy-options
const PROXY_CONFIG = [
  {
    context: [
      "/api/**",
    ],
    target: "https://dev.kubermatic.io",
    changeOrigin: true,
    secure: false,
  },
  {
    context: [
      "ws://**",
      "wss://**",
    ],
    target: "https://dev.kubermatic.io",
    prependPath: false,
    changeOrigin: true,
    secure: false,
    ws: true,
    logLevel: "debug",
  }
];

module.exports = PROXY_CONFIG;
