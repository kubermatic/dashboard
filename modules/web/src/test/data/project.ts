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

import {Project, ProjectStatus} from '@shared/entity/project';

export function fakeProjects(): Project[] {
  return [
    {
      creationTimestamp: new Date(),
      id: '123ab4cd5e',
      name: 'new-project-1',
      status: ProjectStatus.Active,
      owners: [
        {
          creationTimestamp: new Date(),
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
      ],
    },
    {
      creationTimestamp: new Date(),
      id: '234ab5cd6e',
      name: 'new-project-2',
      status: ProjectStatus.Active,
      owners: [
        {
          creationTimestamp: new Date(),
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        {
          creationTimestamp: new Date(),
          name: 'John Doe Junior',
          email: 'johndoejunior@example.com',
        },
      ],
    },
  ];
}

export function fakeProject(): Project {
  return fakeProjects()[0];
}
