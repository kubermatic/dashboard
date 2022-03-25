import {MockedProjectStrategy} from './mocked';
import {RealProjectStrategy} from './real';
import {ProjectStrategy} from './types';

export class ProjectStrategyFactory {
  static new(isAPIMocked: boolean): ProjectStrategy {
    return isAPIMocked ? new MockedProjectStrategy() : new RealProjectStrategy();
  }
}
