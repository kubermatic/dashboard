import {DexPage} from '../pages/dex/dex.po';
import {LoginPage} from '../pages/login/login.po';
import {NavPage} from '../pages/shared/nav.po';

import {KMElement} from './element';

export class AuthUtils {
  private static _loginPage = new LoginPage();
  private static _dexPage = new DexPage();
  private static _navPage = new NavPage();

  static async login(username: string, password: string) {
    await AuthUtils._loginPage.navigateTo();

    await KMElement.click(AuthUtils._loginPage.getLoginButton());

    await KMElement.click(AuthUtils._dexPage.getLoginWithEmailButton());

    await AuthUtils._dexPage.getLoginInput().sendKeys(username);
    await AuthUtils._dexPage.getPasswordInput().sendKeys(password);
    await KMElement.click(AuthUtils._dexPage.getLoginSubmitButton());

    await KMElement.waitToAppear(this._navPage.getLogoutButton());
    expect(AuthUtils._navPage.getLogoutButton().isPresent()).toBeTruthy();
  }

  static async logout() {
    await KMElement.click(AuthUtils._navPage.getLogoutButton());

    await KMElement.waitToAppear(AuthUtils._loginPage.getLoginButton());
    expect(AuthUtils._loginPage.getLoginButton().isPresent()).toBeTruthy();
  }
}
