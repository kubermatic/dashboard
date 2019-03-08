import {DexPage} from '../pages/dex/dex.po';
import {LoginPage} from '../pages/login/login.po';
import {NavPage} from '../pages/shared/nav.po';

import {KMElement} from './element';

export class AuthUtils {
  private static _loginPage = new LoginPage();
  private static _dexPage = new DexPage();
  private static _navPage = new NavPage();

  static login(username: string, password: string): void {
    AuthUtils._loginPage.navigateTo();
    KMElement.waitToAppear(AuthUtils._loginPage.getLoginButton());

    AuthUtils._loginPage.getLoginButton().click();
    AuthUtils._dexPage.getLoginWithEmailButton().click();

    AuthUtils._dexPage.getLoginInput().sendKeys(username);
    AuthUtils._dexPage.getPasswordInput().sendKeys(password);

    AuthUtils._dexPage.getLoginSubmitButton().click();

    KMElement.waitToAppear(this._navPage.getLogoutButton());
    expect(AuthUtils._navPage.getLogoutButton().isPresent()).toBeTruthy();
  }

  static logout(): void {
    KMElement.waitToAppear(AuthUtils._navPage.getLogoutButton());
    expect(AuthUtils._navPage.getLogoutButton().isPresent()).toBeTruthy();

    AuthUtils._navPage.getLogoutButton().click();

    KMElement.waitToAppear(AuthUtils._loginPage.getLoginButton());
    expect(AuthUtils._loginPage.getLoginButton().isPresent()).toBeTruthy();
  }
}
