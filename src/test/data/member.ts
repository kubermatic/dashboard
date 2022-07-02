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

import {Member} from '@shared/entity/member';

export function fakeMembers(): Member[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '123456',
      name: 'John Doe',
      email: 'john.doe@example.com',
      projects: [
        {
          group: 'owners',
          id: '123ab4cd5e',
        },
      ],
    },
    {
      creationTimestamp: new Date(),
      id: '345678',
      name: 'John Doe Jr',
      email: 'john.doe.jr@example.com',
      projects: [
        {
          group: 'editors',
          id: '123ab4cd5e',
        },
      ],
    },
    {
      creationTimestamp: new Date(),
      id: '567890',
      name: 'John Doe Sr',
      email: 'john.doe.sr@example.com',
      projects: [
        {
          group: 'viewers',
          id: '123ab4cd5e',
        },
      ],
    },
  ];
}

export function fakeMember(): Member {
  return {
    creationTimestamp: new Date(+'2022', +'07', +'23'),
    id: '123456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    projects: [
      {
        group: 'owners',
        id: '123ab4cd5e',
      },
    ],
  };
}
