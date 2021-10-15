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

import {ProjectsPage} from '../../pages/projects.po';
import {UserSettingsPage} from '../../pages/user-settings.po';
import {login, logout} from '../../utils/auth';
import {Condition} from '../../utils/condition';
import {View} from '../../utils/view';
import {Mocks} from '../../utils/mocks';

describe('Edition Story', () => {
  const kubermaticEdition = Cypress.env('KUBERMATIC_EDITION');
  const isEnterpriseEdition = kubermaticEdition === 'ee';
  const editionName = isEnterpriseEdition ? 'Enterprise Edition' : 'Community Edition';
  const themePickerAvailability = isEnterpriseEdition ? 'available' : 'not available';

  beforeEach(() => {
    if (Mocks.enabled()) {
      Mocks.register();
    }
  });

  it('should login', () => {
    login();
    cy.url().should(Condition.Include, View.Projects.Default);
  });

  it(`should check if footer contains "${editionName}" text`, () => {
    ProjectsPage.getAppEdition().should(Condition.Contain, editionName);
  });

  it('should go to the user settings', () => {
    UserSettingsPage.visit();
  });

  it(`should check if theme picker is ${themePickerAvailability}`, () => {
    UserSettingsPage.getThemePicker().should(isEnterpriseEdition ? Condition.Exist : Condition.NotExist);
  });

  it('should logout', () => {
    logout();
  });
});
