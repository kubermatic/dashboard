// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {defineConfig} from 'cypress';
import failFast from 'cypress-fail-fast/plugin';
import {deleteAsync} from 'del';

function runnableTestsRegex(...fileName: string[]): string {
  return `cypress/e2e/**/!(${fileName.reduce((prevName, name) => `${prevName}|${name}`)}).spec.ts`;
}

export default defineConfig({
  chromeWebSecurity: false,
  screenshotOnRunFailure: true,
  videoCompression: false,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  pageLoadTimeout: 60000,
  defaultCommandTimeout: 60000,
  responseTimeout: 60000,
  requestTimeout: 60000,
  viewportHeight: 1080,
  viewportWidth: 1920,
  projectId: 'mdsuba',
  video: true,
  e2e: {
    setupNodeEvents(on, config) {
      const isAPIMocked = config.env.MOCKS === 'true' || config.env.MOCKS === true;
      const isEnterpriseEdition = config.env.KUBERMATIC_EDITION === 'ee';
      // TODO: Update once more tests are rewritten
      // const ignored: string[] = ['cypress/**/!(service-accounts|ssh-keys).spec.ts'];
      const ignored: string[] = [
        runnableTestsRegex('service-accounts', 'ssh-keys', 'edition', 'members', 'defaults', 'dynamic-datacenters'),
      ];

      // if (isAPIMocked) {
      //   // TODO: Remove it after configuring mocks.
      //   ignored = ['cypress/**/e2e/stories/opa.spec.ts'];
      // } else {
      //   // TODO: Remove it after fixing flaky tests.
      //   ignored = [
      //     'cypress/**/e2e/providers/anexia.spec.ts',
      //     'cypress/**/e2e/providers/equinix.spec.ts',
      //     'cypress/**/e2e/providers/vsphere.spec.ts',
      //     'cypress/**/e2e/stories/opa.spec.ts',
      //     'cypress/**/e2e/stories/admin-settings/administrators.spec.ts',
      //   ];
      // }

      // Test providers only in enterprise edition.
      // if (!isEnterpriseEdition) {
      //   ignored = ['cypress/**/e2e/providers/**', ...ignored];
      // }

      /* eslint-disable no-console */
      console.log('mocks: ' + isAPIMocked);
      console.log('enterprise edition: ' + isEnterpriseEdition);
      console.log('ignored: ' + ignored);
      /* eslint-enable no-console */

      config.excludeSpecPattern = ignored;

      // Remove videos of successful tests and keep only failed ones.
      // @ts-ignore
      on('after:spec', (_, results) => {
        if (results.stats.failures === 0 && results.video) {
          return deleteAsync(results.video);
        }
      });

      failFast(on, config);
      return config;
    },
    baseUrl: 'http://localhost:8000',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
});
