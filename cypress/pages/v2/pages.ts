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

import {Condition, View} from '@kmtypes';
import {Config} from '@utils/config';
import {Clusters} from './clusters/proxy';
import {DexPage} from './dex/page';
import {Members} from './members/page';
import {Projects} from './projects/page';
import {RootPage} from './root/page';
import {ServiceAccounts} from './serviceaccounts/page';
import {SSHKeys} from './sshkeys/page';
import {UserSettings} from './usersettings/page';
import {Wizard} from './wizard/page';

export class Pages {
  private static readonly _isAPIMocked = Config.isAPIMocked();

  static get Root(): RootPage {
    return new RootPage(this._isAPIMocked);
  }

  static get Dex(): DexPage {
    return new DexPage();
  }

  static get Projects(): Projects {
    return new Projects(this._isAPIMocked);
  }

  static get Members(): Members {
    return new Members(this._isAPIMocked);
  }

  static get ServiceAccounts(): ServiceAccounts {
    return new ServiceAccounts(this._isAPIMocked);
  }

  static get Clusters(): Clusters {
    return new Clusters(this._isAPIMocked);
  }

  static get SSHKeys(): SSHKeys {
    return new SSHKeys(this._isAPIMocked);
  }

  static get Wizard(): Wizard {
    return new Wizard(this._isAPIMocked);
  }

  static get UserSettings(): UserSettings {
    return new UserSettings();
  }

  static expect(view: View): void {
    cy.url().should(Condition.Include, view);
  }
}
