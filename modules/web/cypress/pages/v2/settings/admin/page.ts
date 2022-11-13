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

import {Page, PageOptions} from '@kmtypes';
import {Pages} from '@pages/v2';
import {DynamicDatacenters} from '@pages/v2/settings/admin/dynamic-datacenters/page';
import {Defaults} from './defaults/page';
import {Interface} from './interface/page';

export class AdminSettings extends PageOptions implements Page {
  readonly Elements = new Elements();
  readonly Defaults: Defaults;
  readonly Interface: Interface;
  readonly DynamicDatacenters: DynamicDatacenters;

  constructor(isAPIMocked: boolean) {
    super();

    this.Defaults = new Defaults(isAPIMocked);
    this.Interface = new Interface(isAPIMocked);
    this.DynamicDatacenters = new DynamicDatacenters(isAPIMocked);
  }

  visit(): void {
    Pages.Root.UserPanel.open.click();
    Pages.Root.UserPanel.adminSettings.click();
  }
}

class Elements extends PageOptions {
  get iconCheck(): Cypress.Chainable {
    return this._get('.km-icon-check');
  }
}
