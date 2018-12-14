import {browser, ElementFinder, Locator, WebElement} from 'protractor';

export class BasePage {
  waitForElement(locatorOrElement: Locator|WebElement|ElementFinder): any {
    return browser.wait(() => {
      return browser.isElementPresent(locatorOrElement);
    });
  }
}