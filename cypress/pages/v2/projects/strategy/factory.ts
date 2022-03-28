import {MockedProjectStrategy} from './mocked';
import {ProjectStrategy} from './types';

export class ProjectStrategyFactory {
  static new(isAPIMocked: boolean): ProjectStrategy | undefined {
    return isAPIMocked ? new MockedProjectStrategy() : undefined;
  }
}
