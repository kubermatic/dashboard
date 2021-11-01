// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import webpack from '@cypress/webpack-preprocessor';
import failFast from 'cypress-fail-fast/plugin';
import del from 'del';
import {configuration} from './cy-ts-preprocessor';

export default async (on, config) => {
  const isAPIMocked = config.env.MOCKS === 'true' || config.env.MOCKS === true;
  const isEnterpriseEdition = config.env.KUBERMATIC_EDITION === 'ee';
  let ignored: string[];

  if (isAPIMocked) {
    // TODO: Remove it after configuring mocks.
    ignored = [
      '**/integration/stories/opa.spec.ts',
      '**/integration/stories/admin-settings/administrators.spec.ts',
      '**/integration/stories/admin-settings/custom-links.spec.ts',
      '**/integration/stories/admin-settings/opa-integration.spec.ts',
    ];
  } else {
    // TODO: Remove it after fixing flaky tests.
    ignored = [
      '**/integration/providers/equinix.spec.ts',
      '**/integration/providers/vsphere.spec.ts',
      '**/integration/stories/opa.spec.ts',
      '**/integration/stories/admin-settings/administrators.spec.ts',
    ];
  }

  // Do not test providers in both editions.
  if (!isEnterpriseEdition) {
    ignored = ['**/integration/providers/**', ...ignored];
  }

  /* eslint-disable no-console */
  console.log('mocks: ' + isAPIMocked);
  console.log('enterprise edition: ' + isEnterpriseEdition);
  console.log('ignored: ' + ignored);
  /* eslint-enable no-console */

  config.ignoreTestFiles = ignored;
  on('file:preprocessor', webpack(configuration));

  // Remove videos of successful tests and keep only failed ones.
  // @ts-ignore
  on('after:spec', (_, results) => {
    if (results.stats.failures === 0 && results.video) {
      return del(results.video);
    }
  });

  failFast(on, config);
  return config;
};
