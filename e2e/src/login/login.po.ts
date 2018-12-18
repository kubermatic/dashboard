import {browser, by, element} from 'protractor';
import {NavPage} from '../shared/nav.po';

export class LoginPage extends NavPage {
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
