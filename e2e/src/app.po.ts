import { browser } from 'protractor';

export class AppPage {
  navigateTo(): any {
    return browser.get('/');
  }
}
