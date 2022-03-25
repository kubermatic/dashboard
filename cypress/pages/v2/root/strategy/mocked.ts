import {Mocks} from '../../../../utils/mocks';
import {Pages} from '../../pages';
import {LoginStrategy} from './types';

export class MockedLoginStrategy implements LoginStrategy {
  login(email: string, _: string, isAdmin: boolean): void {
    Mocks.currentUser.email = email;
    Mocks.currentUser.name = email.split('@')[0];
    Mocks.currentUser.isAdmin = isAdmin;

    this._mockAuthCookies();
    Pages.projects().visit();
  }

  private _mockAuthCookies(): void {
    const radix = 36;
    const slice = 2;
    const day = 8640000;
    const nonce = Math.random().toString(radix).slice(slice);
    const header = {alg: 'RS256', typ: 'JWT'};
    const payload = {
      iss: 'http://dex.oauth:5556/dex/auth',
      sub: window.btoa(Math.random().toString(radix).slice(slice)),
      aud: 'kubermatic',
      exp: Date.now() + day,
      iat: Date.now(),
      nonce: nonce,
      email: Mocks.currentUser.email,
      email_verified: true,
      name: 'roxy',
    };
    const signature = Math.random().toString(radix).slice(slice);
    const token =
      window.btoa(JSON.stringify(header)) +
      '.' +
      window.btoa(JSON.stringify(payload)) +
      '.' +
      window.btoa(JSON.stringify(signature));

    cy.setCookie('token', token);
    cy.setCookie('nonce', nonce);
    cy.setCookie('autoredirect', 'true');
  }

  logout(): void {
    cy.clearCookies();
    cy.visit('/');
  }
}
