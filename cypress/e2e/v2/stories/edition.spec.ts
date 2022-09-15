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

import {Intercept} from '@intercept';
import {Condition, View} from '@kmtypes';
import {Pages} from '@pages/v2';
import {Config} from '@utils/config';

describe('Edition Story', () => {
  const editionName = Config.isEnterpriseEdition() ? 'Enterprise Edition' : 'Community Edition';

  beforeEach(() => Intercept.init());

  it('should login', () => {
    Pages.Root.login();
    Pages.Projects.visit();
    Pages.expect(View.Projects.Default);
  });

  it(`should check if footer contains "${editionName}" text`, () => {
    Pages.Projects.Elements.edition.should(Condition.Contain, editionName);
  });

  it('should go to the user settings', () => {
    Pages.UserSettings.visit();
    Pages.expect(View.Account.Default);
  });

  it(`should check if theme picker is ${Config.isEnterpriseEdition() ? 'available' : 'not available'}`, () => {
    Pages.UserSettings.Elements.themePicker.should(Config.isEnterpriseEdition() ? Condition.Exist : Condition.NotExist);
  });

  it('should logout', () => {
    Pages.Root.logout();
  });
});
