import {LoginPage} from './login.po';
import {KMElement} from "../../utils/element";

describe('Login page', () => {
  const page = new LoginPage();

  beforeAll(() => {
    page.navigateTo();
    KMElement.waitToAppear(page.getLoginButton());
  });

  it('should have proper title', () => {
    page.getPageTitle().then((title: string) => {
      expect(title).toEqual('Kubermatic');
    });
  });

  it('should display login button on the navbar', () => {
    expect(page.getNavbarLoginButton().isPresent()).toBeTruthy();
  });

  it('should display login button', () => {
    expect(page.getLoginButton().isPresent()).toBeTruthy();
  });
});
