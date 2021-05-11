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

import {DexPage} from '../pages/dex.po';
import {LoginPage} from '../pages/login.po';
import {Condition} from './condition';
import {ProjectsPage} from '../pages/projects.po';
import {UserPanel} from '../pages/user-panel.po';

export function login(email: string, password: string): void {
  LoginPage.visit();
  LoginPage.getLoginBtn().click();

  // Conditionally click on the login with email btn if it exists
  DexPage.getLoginPanel().then(element => {
    if (DexPage.hasLoginWithEmailBtn(element)) {
      DexPage.getLoginWithEmailBtn().click();
    }
  });

  DexPage.getLoginInput().type(email).should(Condition.HaveValue, email);
  DexPage.getPasswordInput().type(password).should(Condition.HaveValue, password);
  DexPage.getLoginBtn().click();

  ProjectsPage.waitForRefresh();
}

export function logout(): void {
  UserPanel.logout();
  LoginPage.getLoginBtn().should(Condition.Exist);
  cy.reload();
}
