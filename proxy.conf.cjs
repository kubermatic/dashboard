const PROXY_CONFIG = [
  {
    context: ['/api/**'],
    target: 'https://dev.kubermatic.io',
    changeOrigin: true,
    headers: {
      Origin: 'https://dev.kubermatic.io',
    },
    secure: false,
    ws: true,
  },
];

module.exports = PROXY_CONFIG;
