import {browser, by, element} from 'protractor';
import {BasePage} from '../shared/base.po';

export class LoginPage extends BasePage {
  private _loginButton = by.id('login-button');
  private _loginButtonNavbar = by.className('button login');

  navigateTo(): any {
    return browser.get('/');
  }

  getPageTitle(): any {
    return browser.getTitle();
  }

  getLoginButton(): any {
    return element(this._loginButton);
  }

  getNavbarLoginButton(): any {
    return element(this._loginButtonNavbar);
  }
}
