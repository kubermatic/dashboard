import {Condition} from '../../utils/condition';
import {Config} from '../../utils/config';
import {View} from '../../utils/view';
import {Projects} from './projects/page';
import {RootPage} from './root/page';
import {ServiceAccounts} from './serviceaccounts/page';

export class Pages {
  private static readonly _isAPIMocked = Config.isAPIMocked();

  static root(): RootPage {
    return new RootPage(this._isAPIMocked);
  }

  static projects(): Projects {
    return new Projects(this._isAPIMocked);
  }

  static serviceAccounts(): ServiceAccounts {
    return new ServiceAccounts(this._isAPIMocked);
  }

  static expect(view: View): void {
    cy.url().should(Condition.Include, view);
  }
}
