import {browser, ElementFinder, ExpectedConditions} from 'protractor';

const defaultTimeout = 60000;
// Number of retries to make sure that element meets required condition.
const defaultRetries = 5;
// Time to wait between retries (in ms)
const defaultRetryTime = 200;

export class KMElement {
  static async waitToAppear(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries) {
    for(let i=0;i<retries;i++) {
      await browser.wait(ExpectedConditions.visibilityOf(element), waitTimeout);
      await browser.sleep(defaultRetryTime);
    }
  }

  static async waitToDisappear(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries) {
    for(let i=0;i<retries;i++) {
      await browser.wait(ExpectedConditions.invisibilityOf(element), waitTimeout);
      await browser.sleep(defaultRetryTime);
    }
  }

  static async waitForClickable(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries) {
    for(let i=0;i<retries;i++) {
      await browser.wait(ExpectedConditions.elementToBeClickable(element), waitTimeout);
      await browser.sleep(defaultRetryTime);
    }
  }

  static async waitForContent(element: ElementFinder, text: string, waitTimeout = defaultTimeout, retries = defaultRetries) {
    for(let i=0;i<retries;i++) {
      await browser.wait(ExpectedConditions.textToBePresentInElement(element, text), waitTimeout);
      await browser.sleep(defaultRetryTime);
    }
  }

  static async waitForRedirect(url: string, waitTimeout = defaultTimeout, retries = defaultRetries) {
    for(let i=0; i<retries; i++) {
      await browser.wait(ExpectedConditions.urlContains(url), waitTimeout);
      await browser.sleep(defaultRetryTime);
    }
  }

  static async click(element: ElementFinder, waitTimeout = defaultTimeout, retries = defaultRetries) {
    await KMElement.waitForClickable(element, waitTimeout, retries);
    await element.click();
  }

  static async sendKeys(element: ElementFinder, text: string) {
    return await element.getAttribute('value').then(async v => {
      if (v.length < text.length) {
        return await element.sendKeys(text.substring(v.length, text.length)).then(async () => {
          return await KMElement.sendKeys(element, text);
        });
      }
    });
  }
}
