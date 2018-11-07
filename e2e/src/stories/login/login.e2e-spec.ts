import { DexPage } from '../../dex/dex.po';
import { LoginPage } from '../../login/login.po';

describe('login story', () => {
  const loginPage = new LoginPage();
  const dexPage = new DexPage();

  beforeAll(() => {
    loginPage.navigateTo();
  });

  it('should click on login button', async () => {
    expect(loginPage.getLoginButton().isPresent()).toBeTruthy();
    await loginPage.getLoginButton().click();
  });

  it('should choose static credentials button', async () => {
    expect(dexPage.getStaticLoginButton().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginButton().click();
  });

  it('should fill user credentials and login', async () => {
    expect(dexPage.getStaticLoginInput().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginInput().sendKeys('roxy');

    expect(dexPage.getStaticPasswordInput().isPresent()).toBeTruthy();
    await dexPage.getStaticPasswordInput().sendKeys(''); // TODO Missing password.

    expect(dexPage.getStaticLoginSubmitButton().isPresent()).toBeTruthy();
    await dexPage.getStaticLoginSubmitButton().click();
  });
});
