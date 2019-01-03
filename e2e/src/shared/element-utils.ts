import {browser, by, element, ElementFinder, ExpectedConditions} from "protractor";

export class KMElement {
  static waitToAppear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.visibilityOf(element), 15000);
  }

  static waitToDisappear(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.stalenessOf(element), 15000);
  }

  static waitForClickable(element: ElementFinder): any {
    return browser.wait(ExpectedConditions.elementToBeClickable(element), 15000);
  }

  /**
   * @param url - partial url or full expected url after redirect
   */
  static waitForRedirect(url: string): any {
    return browser.wait(ExpectedConditions.urlContains(url), 15000);
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