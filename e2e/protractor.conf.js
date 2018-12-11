// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {SpecReporter} = require('jasmine-spec-reporter');

exports.config = {
  allScriptsTimeout: 10000,

  specs: [
    './src/**/*.e2e-spec.ts'
  ],

  multiCapabilities: [{
    browserName: 'chrome',
    chromeOptions: {
      args: ['--headless', '--no-sandbox', '--disable-gpu']
    }
  }, {
    browserName: 'firefox',
    'moz:firefoxOptions': {
      args: ['--headless']
    }
  }],

  framework: 'jasmine',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000,
  },

  directConnect: true,
  baseUrl: 'http://localhost:8000/',

  onPrepare() {
    if (process.env.KUBERMATIC_E2E_USERNAME === undefined ||
      process.env.KUBERMATIC_E2E_PASSWORD === undefined) {
      throw new Error(`'KUBERMATIC_E2E_USERNAME' and 'KUBERMATIC_E2E_PASSWORD' environment variables have to be set.`)
    }

    browser.params.KUBERMATIC_E2E_USERNAME = process.env.KUBERMATIC_E2E_USERNAME;
    browser.params.KUBERMATIC_E2E_PASSWORD = process.env.KUBERMATIC_E2E_PASSWORD;

    require('ts-node').register({
      project: require('path').join(__dirname, './tsconfig.e2e.json')
    });

    jasmine.getEnv().addReporter(new SpecReporter({
      spec: {
        displayStacktrace: true,
        displayDuration: true,
      },
    }));

    browser.waitForAngularEnabled(false);
  }
};
