import {KMElement} from '../shared/element';
import {LoginPage} from '../login/login.po';
import {DexPage} from '../dex/dex.po';
import {NavPage} from '../shared/nav.po';

export class AuthCommons {
  private static _loginPage = new LoginPage();
  private static _dexPage = new DexPage();
  private static _navPage = new NavPage();

  static login(username: string, password: string): void {
    AuthCommons._loginPage.navigateTo();
    KMElement.waitToAppear(AuthCommons._loginPage.getLoginButton());

    AuthCommons._loginPage.getLoginButton().click();
    AuthCommons._dexPage.getLoginWithEmailButton().click();

    AuthCommons._dexPage.getLoginInput().sendKeys(username);
    AuthCommons._dexPage.getPasswordInput().sendKeys(password);

    AuthCommons._dexPage.getLoginSubmitButton().click();

    KMElement.waitToAppear(this._navPage.getLogoutButton());
    expect(AuthCommons._navPage.getLogoutButton().isPresent()).toBeTruthy();
  }

  static logout(): void {
    KMElement.waitToAppear(AuthCommons._navPage.getLogoutButton());
    expect(AuthCommons._navPage.getLogoutButton().isPresent()).toBeTruthy();

    AuthCommons._navPage.getLogoutButton().click();

    KMElement.waitToAppear(AuthCommons._loginPage.getLoginButton());
    expect(AuthCommons._loginPage.getLoginButton().isPresent()).toBeTruthy();
  }
}
