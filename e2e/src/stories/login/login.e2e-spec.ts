import { browser, by, element } from 'protractor';
import { LoginPage } from '../../login/login.po';

describe('login story', () => {
  const page = new LoginPage();

  beforeAll(() => {
    browser.waitForAngularEnabled(false); // TODO
    page.navigateTo();
  });

  it('should click on login button', async () => {
    await page.getLoginButton().click();
  });

  it('should choose static credentials button', async () => {
    await element(by.xpath('/html/body/div[2]/div/div/div[3]/a')).click(); // TODO
  });

  it('should fill user credentials and login', async () => {
    await element(by.xpath('//input[@id="login"]')).sendKeys('roxy');
    await element(by.xpath('//input[@id="password"]')).sendKeys(''); // TODO
    await element(by.id('submit-login')).click();
  });
});
