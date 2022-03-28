import {Condition} from '../../utils/condition';
import {Config} from '../../utils/config';
import {View} from '../../utils/view';
import {DexPage} from './dex/page';
import {Projects} from './projects/page';
import {RootPage} from './root/page';
import {ServiceAccounts} from './serviceaccounts/page';

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

  static get ServiceAccounts(): ServiceAccounts {
    return new ServiceAccounts(this._isAPIMocked);
  }

  static expect(view: View): void {
    cy.url().should(Condition.Include, view);
  }
}
