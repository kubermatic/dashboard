import {browser, by, element} from 'protractor';
import {NavPage} from '../shared/nav.po';

export class LoginPage extends NavPage {
  navigateTo(): any {
    return browser.get('/');
  }

  getPageTitle(): any {
    return browser.getTitle();
  }

  getLoginButton(): any {
    return element(by.id('login-button'));
  }

  getNavbarLoginButton(): any {
    return element(by.className('km-button km-login'));
  }
}
