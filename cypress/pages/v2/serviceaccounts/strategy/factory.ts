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

import {MockedServiceAccountStrategy, MockedServiceAccountTokenStrategy} from './mocked';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './types';

export class ServiceAccountStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountStrategy | undefined {
    return isAPIMocked ? new MockedServiceAccountStrategy() : undefined;
  }
}

export class ServiceAccountTokenStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountTokenStrategy | undefined {
    return isAPIMocked ? new MockedServiceAccountTokenStrategy() : undefined;
  }
}
