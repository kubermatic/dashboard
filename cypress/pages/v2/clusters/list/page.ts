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

import {Page, PageOptions} from '../../types';

export class ClusterList extends PageOptions implements Page {
  // private readonly _strategy: ProjectStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    // this._strategy = ProjectStrategyFactory.new(isAPIMocked);
  }

  visit(): void {
    this.Buttons.nav.click();
  }

  select(name: string): void {}

  delete(name: string): void {}
}

class Elements extends PageOptions {}

class Buttons extends PageOptions {
  get nav(): Cypress.Chainable {
    return this._get('#km-nav-item-clusters');
  }
}
