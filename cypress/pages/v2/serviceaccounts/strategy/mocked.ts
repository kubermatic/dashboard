import {Endpoint} from '../../../../utils/endpoint';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './types';

export class MockedServiceAccountStrategy implements ServiceAccountStrategy {
  private static readonly _fixturePath = 'service-accounts.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountStrategy._activeFixture = MockedServiceAccountStrategy._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountStrategy._activeFixture = MockedServiceAccountStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.ServiceAccounts, req => {
      req.reply({fixture: MockedServiceAccountStrategy._activeFixture});
    });
  }
}

export class MockedServiceAccountTokenStrategy implements ServiceAccountTokenStrategy {
  private static readonly _fixturePath = 'tokens.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountTokenStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountTokenStrategy._activeFixture = MockedServiceAccountTokenStrategy._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountTokenStrategy._activeFixture = MockedServiceAccountTokenStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.ServiceAccountTokens, req => {
      req.reply({fixture: MockedServiceAccountTokenStrategy._activeFixture});
    });
  }
}
