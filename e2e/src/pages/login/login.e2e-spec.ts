import {KMElement} from '../../utils/element';

import {LoginPage} from './login.po';

describe('Login page', () => {
  const page = new LoginPage();

  beforeAll(async () => {
    await page.navigateTo();

    await KMElement.waitToAppear(page.getLoginButton());
  });

  it('should have proper title', async () => {
    expect(await page.getPageTitle()).toEqual('Kubermatic');
  });

  it('should display login button on the navbar', async () => {
    expect(await page.getNavbarLoginButton().isDisplayed()).toBeTruthy();
  });

  it('should display login button', async () => {
    expect(await page.getLoginButton().isDisplayed()).toBeTruthy();
  });
});
