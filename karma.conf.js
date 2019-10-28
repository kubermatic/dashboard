// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
  let configuration = {
    basePath: '',
    frameworks: ['parallel', 'jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-parallel'),
      require('karma-jasmine'),
      require('karma-mocha-reporter'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-chrome-launcher'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('@angular/material')
    ],
    client:{
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        timeoutInterval: 10000,
      }
    },
    files: [
      {pattern: './node_modules/@angular/material/prebuilt-themes/indigo-pink.css'},
      {pattern: '/assets/*', watched: false, included: false, served: true},
    ],
    preprocessors: {},
    mime: {
      'text/x-typescript': ['ts','tsx']
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'), reports: [ 'html', 'lcovonly' ],
      fixWebpackSourcePaths: true
    },
    proxies:  {
      '/assets/': '/base/assets/'
    },
    reporters: config.angularCli && config.angularCli.codeCoverage
      ? ['mocha', 'coverage-istanbul']
      : ['mocha', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--no-sandbox',
          '--no-first-run',
          '--no-default-browser-check',
          '--enable-logging',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-default-apps',
          '--disable-popup-blocking',
          '--disable-translate',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-device-discovery-notifications',
          '--remote-debugging-port=9222'
        ],
      },
    },
    captureTimeout: 300000,
    browserNoActivityTimeout : 300000,
    browserDisconnectTimeout : 300000,
    browserDisconnectTolerance: 0,
  };

  // Disable parallel testing on prow as it takes too much resources.
  if(!!process.env.PROW_JOB_ID) {
    configuration.frameworks = ['jasmine', '@angular-devkit/build-angular'];
    configuration.plugins = [
      require('karma-jasmine'),
      require('karma-mocha-reporter'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('karma-chrome-launcher'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('@angular/material')
    ];
  }

  config.set(configuration);
};
