import {browser, by, element, ElementFinder, ExpectedConditions} from "protractor";

const waitTimeout = 60000;

export class KMElement {
  static waitToAppear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.visibilityOf(element), waitTimeout);
  }

  static waitToDisappear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.stalenessOf(element), waitTimeout);
  }

  static waitForClickable(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.elementToBeClickable(element), waitTimeout);
  }

  /**
   * @param url - partial url or full expected url after redirect
   */
  static waitForRedirect(url: string): any {
    return browser.wait(ExpectedConditions.urlContains(url), waitTimeout);
  }

  static waitForNotifications(): any {
    const closeBtn = by.className('sn-close-button');
    if(!element(closeBtn).isPresent()) {
      return;
    }

    return element.all(closeBtn).then((elements: any[]) => {
      elements.forEach((elem) => {
        KMElement.waitToAppear(elem);
        elem.click();
        KMElement.waitToDisappear(elem);
      });
    });
  }

  static sendKeys(element: ElementFinder, text: string): any {
    return element.getAttribute('value').then((v) => {
      if(v.length < text.length) {
        return element.sendKeys(text.substring(v.length, text.length)).then(() => {
          return KMElement.sendKeys(element, text);
        });
      }
    });
  }
}