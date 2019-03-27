import {browser, by, element, ElementFinder, ExpectedConditions} from 'protractor';

const defaultTimeout = 60000;
// Number of retries to make sure that element meets required condition.
const defaultRetries = 5;

export class KMElement {
  static waitToAppear(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries): void {
    for(let i=0;i<retries;i++) {
      browser.wait(ExpectedConditions.visibilityOf(element), waitTimeout);
      browser.sleep(1000);
    }
  }

  static waitToDisappear(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries): void {
    for(let i=0;i<retries;i++) {
      browser.wait(ExpectedConditions.invisibilityOf(element), waitTimeout);
      browser.sleep(1000);
    }
  }

  static waitForClickable(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries): void {
    for(let i=0;i<retries;i++) {
      browser.wait(ExpectedConditions.elementToBeClickable(element), waitTimeout);
      browser.sleep(1000);
    }
  }

  static waitForContent(element: ElementFinder, text: string, waitTimeout = defaultTimeout, retries = defaultRetries): void {
    for(let i=0;i<retries;i++) {
      browser.wait(ExpectedConditions.textToBePresentInElement(element, text), waitTimeout);
      browser.sleep(1000);
    }
  }

  /**
   * @param url - partial url or full expected url after redirect
   * @param waitTimeout - wait timeout for the operation to complete
   */
  static waitForRedirect(url: string, waitTimeout = defaultTimeout, retries = defaultRetries): void {
    for(let i=0;i<retries;i++) {
      browser.wait(ExpectedConditions.urlContains(url), waitTimeout);
      browser.sleep(1000);
    }
  }

  static async waitForNotifications(): Promise<any> {
    const closeBtn = by.className('sn-close-button');
    if (!element(closeBtn).isPresent()) {
      return Promise.resolve(true);
    }

    return await element.all(closeBtn).then((elements: any[]) => {
      elements.forEach(async (elem) => {
        await KMElement.waitToAppear(elem);
        elem.click();
        await KMElement.waitToDisappear(elem);
      });
    });
  }

  static async sendKeys(element: ElementFinder, text: string): Promise<any> {
    return await element.getAttribute('value').then((v) => {
      if (v.length < text.length) {
        return element.sendKeys(text.substring(v.length, text.length)).then(() => {
          return KMElement.sendKeys(element, text);
        });
      }
    });
  }
}
