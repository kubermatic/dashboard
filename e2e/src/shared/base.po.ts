import {browser, by, element, ElementFinder, ExpectedConditions} from 'protractor';

export class BasePage {
  private _notificationCloseButton = by.className('sn-close-button');

  waitForElement(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.visibilityOf(element), 15000);
  }

  waitToDisappear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.stalenessOf(element), 15000);
  }

  /**
   * @param url - partial url or full expected url after redirect
   */
  waitForRedirect(url: string): any {
    return browser.wait(ExpectedConditions.urlContains(url), 15000);
  }

  waitForNotifications(): any {
    return element.all(this._notificationCloseButton).then((elements: any[]) => {
      elements.forEach((elem) => {
        this.waitToDisappear(elem);
      });
    });
  }
}
