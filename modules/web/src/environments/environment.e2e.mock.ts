// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

export const environment = {
  name: 'mock',
  production: false,
  configUrl: '../../assets/config/config.json',
  gitVersionUrl: '../../assets/config/version.json',
  refreshTimeBase: 1000,
  restRoot: '/api/v1',
  newRestRoot: '/api/v2',
  wsRoot: '',
  avoidWebsockets: true,
  oidcProviderUrl: '',
  oidcConnectorId: '',
  animations: false,
};
