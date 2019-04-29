import {browser, by, element, ElementFinder, ExpectedConditions} from 'protractor';
import {defaultTimeout, second } from './constants';

export class KMElement {
  static async fill(element: ElementFinder, text: string, waitTimeout = defaultTimeout) {
    await KMElement.waitToAppear(element, waitTimeout);
    await element.clear();
    await KMElement._sendKeys(element, text);
  }

  static async click(element: ElementFinder, waitTimeout = defaultTimeout) {
    await KMElement.waitForClickable(element, waitTimeout);
    await element.click();
  }

  static async waitForClickable(element: ElementFinder, waitTimeout = defaultTimeout) {
    await browser.wait(ExpectedConditions.elementToBeClickable(element), waitTimeout);
  }

  static async waitForContent(element: ElementFinder, text: string, waitTimeout = defaultTimeout) {
    await browser.wait(ExpectedConditions.textToBePresentInElement(element, text), waitTimeout);
  }

  static async waitForRedirect(url: string, waitTimeout = defaultTimeout) {
    await browser.wait(ExpectedConditions.urlContains(url), waitTimeout);
    await browser.sleep(3 * second);
  }

  static async waitToAppear(element: ElementFinder, waitTimeout = defaultTimeout) {
    await browser.wait(ExpectedConditions.visibilityOf(element), waitTimeout);
  }

  static async waitToDisappear(element: ElementFinder, waitTimeout = defaultTimeout) {
    await browser.wait(ExpectedConditions.stalenessOf(element), waitTimeout);
    await browser.sleep(10 * second);
  }

  static async waitForNotifications() {
    const closeBtn = by.className('sn-close-button');
    if(await !browser.isElementPresent(element(closeBtn))) {
      return;
    }

    return element.all(closeBtn).then(async elements => {
      elements.forEach(async elem => {
        await KMElement.click(elem);
        await KMElement.waitToDisappear(elem);
      });
    });
  }

  private static async _sendKeys(element: ElementFinder, text: string) {
    return element.getAttribute('value').then(async v => {
      if (v.length < text.length) {
        return await element.sendKeys(text.substring(v.length, text.length)).then(async () => {
          return await KMElement._sendKeys(element, text);
        });
      }
    });
  }
}
