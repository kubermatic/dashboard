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

import {ServiceAccount, ServiceAccountToken} from '@shared/entity/service-account';

export function fakeServiceAccounts(): ServiceAccount[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '987zy6xv5u',
      name: 'test-service-account',
      status: 'Active',
      group: 'editors',
    },
    {
      creationTimestamp: new Date(),
      id: '765zy4xv3u',
      name: 'test-service-account-2',
      status: 'Active',
      group: 'viewers',
    },
  ];
}

export function fakeServiceAccount(): ServiceAccount {
  return {
    creationTimestamp: new Date(),
    id: '987zy6xv5u',
    name: 'test-service-account',
    status: 'Active',
    group: 'editors',
  };
}

export function fakeServiceAccountTokens(): ServiceAccountToken[] {
  return [
    {
      creationTimestamp: new Date(),
      expiry: new Date(),
      id: 'sa-token-987zy6xv5u',
      name: 'test-service-account-token',
      token: 'secret-test-token',
    },
    {
      creationTimestamp: new Date(),
      expiry: new Date(),
      id: '765zy4xv3u',
      name: 'test-service-account-token-2',
      token: 'secret-test-token-2',
    },
  ];
}

export function fakeServiceAccountToken(): ServiceAccountToken {
  return {
    creationTimestamp: new Date(),
    expiry: new Date(),
    id: 'sa-token-987zy6xv5u',
    name: 'test-service-account-token',
    token: 'secret-test-token',
  };
}
