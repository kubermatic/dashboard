import {MockedLoginStrategy} from './mocked';
import {RealLoginStrategy} from './real';
import {LoginStrategy} from './types';

export class LoginStrategyFactory {
  static new(isAPIMocked: boolean): LoginStrategy {
    return isAPIMocked ? new MockedLoginStrategy() : new RealLoginStrategy();
  }
}
