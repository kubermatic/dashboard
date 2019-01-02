import {by, element} from 'protractor';

export class DexPage {
  getStaticLoginButton(): any {
    return element(by.xpath('//span[contains(text(),"Static Credentials")]'));
  }

  getStaticLoginInput(): any {
    return element(by.xpath('//input[@id="login"]'));
  }

  getStaticPasswordInput(): any {
    return element(by.xpath('//input[@id="password"]'));
  }

  getStaticLoginSubmitButton(): any {
    return element(by.id('submit-login'));
  }
}
