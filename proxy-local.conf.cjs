const PROXY_CONFIG = [
  {
    context: ['/api/**'],
    target: 'http://localhost:8080',
    changeOrigin: true,
    secure: false,
    ws: true,
  },
];

module.exports = PROXY_CONFIG;
