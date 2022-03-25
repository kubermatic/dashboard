import {Endpoint} from '../../../../utils/endpoint';
import {ServiceAccountState, ServiceAccountTokenState} from './types';

export class MockedServiceAccountState implements ServiceAccountState {
  private static readonly _fixturePath = 'service-accounts.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountState._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountState._activeFixture = MockedServiceAccountState._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountState._activeFixture = MockedServiceAccountState._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.ServiceAccounts, req => {
      req.reply({fixture: MockedServiceAccountState._activeFixture});
    });
  }
}

export class MockedServiceAccountTokenState implements ServiceAccountTokenState {
  private static readonly _fixturePath = 'tokens.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedServiceAccountTokenState._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedServiceAccountTokenState._activeFixture = MockedServiceAccountTokenState._fixturePath;
  }

  onDelete(): void {
    MockedServiceAccountTokenState._activeFixture = MockedServiceAccountTokenState._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.ServiceAccountTokens, req => {
      req.reply({fixture: MockedServiceAccountTokenState._activeFixture});
    });
  }
}
