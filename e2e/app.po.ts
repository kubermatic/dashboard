import { browser, element, by } from 'protractor';

export class DashboardPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('kubermatic-root h1')).getText();
  }
}
