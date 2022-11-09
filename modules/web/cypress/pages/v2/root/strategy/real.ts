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

import {LoginStrategy} from '@kmtypes';
import {Pages} from '@pages/v2';
import {RootPage} from '../page';

export class RealLoginStrategy implements LoginStrategy {
  constructor(private readonly _context: RootPage) {}

  login(email: string, password: string): void {
    this._context.visit();
    this._context.Buttons.login.click();
    Pages.Dex.login(email, password);
  }

  logout(): void {
    this._context.UserPanel.open.click();
    this._context.UserPanel.logout.click();
  }
}
