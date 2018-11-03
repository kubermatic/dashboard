import { browser, by, element } from 'protractor';

export class LoginPage {
  navigateTo(): any {
    return browser.get('/');
  }

  getPageTitle(): any {
    return browser.getTitle();
  }

  getLoginButton(): any {
    return element(by.id('login-button'));
  }

  getInnerText(): any {
    return element(by.className('frontpage-inner-text')).getText();
  }
}
