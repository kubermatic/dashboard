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

import {Condition} from '../../utils/condition';
import {Config} from '../../utils/config';
import {View} from '../../utils/view';
import {Clusters} from './clusters/proxy';
import {DexPage} from './dex/page';
import {Projects} from './projects/page';
import {RootPage} from './root/page';
import {ServiceAccounts} from './serviceaccounts/page';
import {SSHKeys} from './sshkeys/page';
import {Wizard} from './wizard/page';
import {UserSettings} from './usersettings/page';
import {Members} from './members/page';

export class Pages {
  private static readonly _isAPIMocked = Config.isAPIMocked();

  static get Root(): RootPage {
    this._build();
    return new RootPage(this._isAPIMocked);
  }

  static get Dex(): DexPage {
    this._build();
    return new DexPage();
  }

  static get Projects(): Projects {
    this._build();
    return new Projects(this._isAPIMocked);
  }

  static get Members(): Members {
    this._build();
    return new Members(this._isAPIMocked);
  }

  static get ServiceAccounts(): ServiceAccounts {
    this._build();
    return new ServiceAccounts(this._isAPIMocked);
  }

  static get Clusters(): Clusters {
    this._build();
    return new Clusters(this._isAPIMocked);
  }

  static get SSHKeys(): SSHKeys {
    this._build();
    return new SSHKeys(this._isAPIMocked);
  }

  static get Wizard(): Wizard {
    this._build();
    return new Wizard(this._isAPIMocked);
  }

  static get UserSettings(): UserSettings {
    this._build();
    return new UserSettings();
  }

  static expect(view: View): void {
    cy.url().should(Condition.Include, view);
  }

  /**
   * This method is enforcing the intercept registration
   * in order to "remember" the state of previous "it"
   * changes.
   *
   * @private
   */
  private static _build(): Pages {
    new RootPage(this._isAPIMocked);
    new DexPage();
    new Projects(this._isAPIMocked);
    new ServiceAccounts(this._isAPIMocked);
    new Clusters(this._isAPIMocked);
    new SSHKeys(this._isAPIMocked);
    new Wizard(this._isAPIMocked);

    return this;
  }
}
