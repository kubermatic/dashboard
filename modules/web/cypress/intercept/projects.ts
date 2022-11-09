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

import {Endpoints, Fixtures, RequestType} from '@kmtypes';

export class Projects {
  private static _projectListFixture = Fixtures.EmptyArray;
  private static _projectFixture = Fixtures.EmptyObject;

  constructor() {
    cy.intercept(RequestType.GET, Endpoints.Resource.Project.List, req =>
      req.reply({fixture: Projects._projectListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.Project.List, req =>
      req.reply({fixture: Projects._projectFixture})
    );
    cy.intercept(Endpoints.Resource.Project.Detail, req => req.reply({fixture: Projects._projectFixture}));
  }

  onCreate(): void {
    Projects._projectListFixture = Fixtures.Resource.Project.List;
    Projects._projectFixture = Fixtures.Resource.Project.Detail;
  }

  onDelete(): void {
    Projects._projectListFixture = Fixtures.EmptyArray;
    Projects._projectFixture = Fixtures.EmptyObject;
  }
}
