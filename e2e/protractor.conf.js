// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const {SpecReporter} = require('jasmine-spec-reporter');

exports.config = createConfig();

function createConfig() {
  const config = {
    allScriptsTimeout: 30000,
    specs: [
      './src/**/*.e2e-spec.ts'
    ],

    maxSessions: 1,
    capabilities: {
      browserName: 'chrome',
      chromeOptions: {
        args: ['--no-sandbox', '--disable-gpu', '--window-size=1920,1080']
      }
    },

    framework: 'jasmine',
    jasmineNodeOpts: {
      defaultTimeoutInterval: 60000,
    },

    directConnect: true,
    baseUrl: 'http://localhost:8000/',

    onPrepare() {
      if (process.env.KUBERMATIC_DEX_DEV_E2E_USERNAME === undefined ||
        process.env.KUBERMATIC_DEX_DEV_E2E_PASSWORD === undefined) {
        throw new Error(`'KUBERMATIC_DEX_DEV_E2E_USERNAME' and 'KUBERMATIC_DEX_DEV_E2E_PASSWORD' environment variables have to be set.`)
      }

      browser.params.KUBERMATIC_E2E_USERNAME = process.env.KUBERMATIC_DEX_DEV_E2E_USERNAME;
      browser.params.KUBERMATIC_E2E_PASSWORD = process.env.KUBERMATIC_DEX_DEV_E2E_PASSWORD;

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

      afterEach(() => {
        browser.manage().logs().get('browser').then(function (browserLog) {
          browserLog.forEach((entry) => {
            console.log('log: ' + entry.message);
          });
        });
      });
    }
  };

  if (!!process.env.JOB_NAME) {
    config.capabilities = {
      browserName: 'chrome',
      chromeOptions: {
        args: ['--headless', '--no-sandbox', '--disable-gpu', '--window-size=1920,1080', '--disable-extensions', '--disable-dev-shm-usage', '--disable-infobars']
      },
      loggingPrefs: {
        driver: 'DEBUG',
        server: 'DEBUG',
        browser: 'DEBUG'
      }
    };
  }

  return config;
}
