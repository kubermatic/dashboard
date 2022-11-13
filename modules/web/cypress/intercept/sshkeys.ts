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

export class SSHKeys {
  private static _sshKeyListFixture = Fixtures.EmptyArray;
  private static _sshKeyFixture = Fixtures.EmptyObject;

  constructor() {
    cy.intercept(RequestType.GET, Endpoints.Resource.SSHKey.List, req =>
      req.reply({fixture: SSHKeys._sshKeyListFixture})
    );
    cy.intercept(RequestType.POST, Endpoints.Resource.SSHKey.List, req => req.reply({fixture: SSHKeys._sshKeyFixture}));
    cy.intercept(Endpoints.Resource.SSHKey.Detail, req => req.reply({fixture: SSHKeys._sshKeyFixture}));
  }

  onCreate(): void {
    SSHKeys._sshKeyListFixture = Fixtures.Resource.SSHKey.List;
    SSHKeys._sshKeyFixture = Fixtures.Resource.SSHKey.Detail;
  }

  onDelete(): void {
    SSHKeys._sshKeyListFixture = Fixtures.EmptyArray;
    SSHKeys._sshKeyFixture = Fixtures.EmptyObject;
  }
}
