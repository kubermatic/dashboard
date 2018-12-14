import {browser, ElementFinder, ExpectedConditions} from 'protractor';

export class BasePage {
  waitForElement(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.visibilityOf(element), 30000);
  }

  waitToDisappear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.stalenessOf(element), 30000);
  }
}
