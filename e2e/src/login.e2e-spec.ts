import { LoginPage } from './login.po';
import { browser } from 'protractor';

describe('login page', () => {
  const page = new LoginPage();

  beforeAll(() => {
    browser.waitForAngularEnabled(false); // TODO
    page.navigateTo();
  });

  it('should have proper title', function () {
    page.getPageTitle().then((title: string) => {
      expect(title).toEqual('Kubermatic');
    });
  });

  it('should display proper inner text', () => {
    expect(page.getInnerText()).toContain('SCALE APPS WITH ONE CLICK');
  });

  it('should display login button', () => {
    expect(page.getLoginButton().isPresent()).toBeTruthy();
  });
});
