import {Endpoint} from '../../../../utils/endpoint';
import {ProjectStrategy} from './types';

export class MockedProjectStrategy implements ProjectStrategy {
  private static readonly _fixturePath = 'projects.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedProjectStrategy._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedProjectStrategy._activeFixture = MockedProjectStrategy._fixturePath;
  }

  onDelete(): void {
    MockedProjectStrategy._activeFixture = MockedProjectStrategy._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.Projects, req => req.reply({fixture: MockedProjectStrategy._activeFixture}));
  }
}
