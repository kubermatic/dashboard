// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import webpack from '@cypress/webpack-preprocessor';
import failFast from 'cypress-fail-fast/plugin';
import {configuration} from './cy-ts-preprocessor';

export default async (on, config) => {
  let ignored = [
    '**/integration/providers/kubevirt.spec.ts',
    '**/integration/providers/openstack.spec.ts',
    '**/integration/providers/vsphere.spec.ts',
    '**/integration/stories/machine-deployment.spec.ts',
    '**/integration/stories/opa.spec.ts',
    '**/integration/stories/admin-settings/administrators.spec.ts',
  ];
  if (config.env.edition !== 'ee') {
    ignored = [...ignored, '**/integration/providers/*.spec.ts'];
  }
  config.ignoreTestFiles = ignored;
  // eslint-disable-next-line no-console
  console.log('Testing ' + config.env.edition + ', ignoring: ' + config.ignoreTestFiles);

  on('file:preprocessor', webpack(configuration));
  failFast(on, config);
  return config;
};
