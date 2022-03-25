import {Endpoint} from '../../../../utils/endpoint';
import {ProjectState} from './types';

export class MockedProjectState implements ProjectState {
  private static readonly _fixturePath = 'projects.json';
  private static readonly _fixtureEmptyArrayPath = 'empty-array.json';
  private static _activeFixture = MockedProjectState._fixtureEmptyArrayPath;

  constructor() {
    this._init();
  }

  onCreate(): void {
    MockedProjectState._activeFixture = MockedProjectState._fixturePath;
  }

  onDelete(): void {
    MockedProjectState._activeFixture = MockedProjectState._fixtureEmptyArrayPath;
  }

  private _init(): void {
    cy.intercept(Endpoint.Projects, req => {
      req.reply({fixture: MockedProjectState._activeFixture});
    });
  }
}
