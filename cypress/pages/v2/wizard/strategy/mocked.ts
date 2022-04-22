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

import {WizardStrategy} from '@ctypes/pages';
import {Provider} from '@ctypes/provider';
import {Intercept} from '@intercept/intercept';

export class MockedWizardStrategy implements WizardStrategy {
  onCreate(provider: Provider): void {
    Intercept.Clusters(provider).onCreate();
  }

  onSSHKeyAdd(provider: Provider): void {
    Intercept.Clusters(provider).onSSHKeyCreate();
  }
}
