const PROXY_CONFIG = [
  {
    context: [
      "/api/**",
    ],
    target: "https://dev.kubermatic.io",
    changeOrigin: true,
    secure: false,
    ws: true,
  }
];

module.exports = PROXY_CONFIG;
