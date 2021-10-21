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

  if (isAPIMocked) {
    // Skip everything except already mocked tests.
    // TODO: Remove all ignores tests have their mocks configured.
    config.ignoreTestFiles = [
      '**/integration/stories/opa.spec.ts',
      '**/integration/stories/admin-settings/administrators.spec.ts',
      '**/integration/stories/admin-settings/cluster-settings.spec.ts',
      '**/integration/stories/admin-settings/custom-links.spec.ts',
      '**/integration/stories/admin-settings/dynamic-datacenters.spec.ts',
      '**/integration/stories/admin-settings/opa-integration.spec.ts',
      '**/integration/stories/admin-settings/resource-quota.spec.ts',
    ];
  } else {
    // Skip flaky and already mocked tests.
    // TODO: Remove all ignores after fixing flaky tests and making the full tests optional.
    config.ignoreTestFiles = [
      '**/integration/providers/**.spec.ts',
      '**/integration/stories/edition.spec.ts',
      '**/integration/stories/external-cluster.spec.ts',
      '**/integration/stories/multi-owner.spec.ts',
      '**/integration/stories/opa.spec.ts',
      '**/integration/stories/service-accounts.spec.ts',
      '**/integration/stories/ssh-keys.spec.ts',
      '**/integration/stories/user-settings.spec.ts',
      '**/integration/stories/admin-settings/administrators.spec.ts',
      '**/integration/stories/admin-settings/machine-deployment-replicas.spec.ts',
      '**/integration/stories/admin-settings/presets.spec.ts',
      '**/integration/stories/admin-settings/project-limit.spec.ts',
    ];
  }

  /* eslint-disable no-console */
  console.log('mocks: ' + isAPIMocked);
  console.log('enterprise edition: ' + isEnterpriseEdition);
  console.log('ignore: ' + config.ignoreTestFiles);
  /* eslint-enable no-console */

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
