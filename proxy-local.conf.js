const PROXY_CONFIG = [
  {
    context: [
      "/api/**",
    ],
    target: "http://localhost:8080",
    changeOrigin: true,
    secure: false,
  },
  {
    context: [
      "ws://**",
      "wss://**",
    ],
    target: "http://localhost:8080",
    prependPath: false,
    changeOrigin: true,
    secure: false,
    ws: true,
    logLevel: "debug",
  }
];

module.exports = PROXY_CONFIG;
