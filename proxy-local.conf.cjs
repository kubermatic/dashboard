const PROXY_CONFIG = [
  {
    context: ['/api/**'],
    target: 'http://127.0.0.1:8080',
    changeOrigin: true,
    secure: false,
    ws: true,
  },
];

module.exports = PROXY_CONFIG;
