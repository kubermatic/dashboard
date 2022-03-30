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

import {PageOptions} from '../types';

export class DexPage extends PageOptions {
  readonly Elements = new Elements();
  readonly Buttons = new Buttons();

  constructor() {
    super();
  }

  login(email: string, password: string): void {
    this.Elements.loginPanel.then(element => {
      if (this.Buttons.hasLoginWithEmailOption(element)) {
        this.Buttons.loginWithEmail.click();
      }
    });

    this.Elements.loginInput.type(email);
    this.Elements.passwordInput.type(password);
    this.Buttons.login.click();
  }
}

class Elements extends PageOptions {
  get loginInput(): Cypress.Chainable {
    return cy.get('input#login');
  }

  get passwordInput(): Cypress.Chainable {
    return cy.get('input#password');
  }

  get loginPanel(): Cypress.Chainable {
    return cy.get('.theme-form-row');
  }
}

class Buttons extends PageOptions {
  get login(): Cypress.Chainable {
    return cy.get('button#submit-login');
  }

  get loginWithEmail(): Cypress.Chainable {
    return cy.get('.dex-btn-text').contains('Log in with Email');
  }

  hasLoginWithEmailOption(element: any): boolean {
    return element.find('.dex-btn-text').text('Log in with Email').length > 0;
  }
}
