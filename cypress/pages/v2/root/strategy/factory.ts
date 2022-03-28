import {RootPage} from '../page';
import {MockedLoginStrategy} from './mocked';
import {RealLoginStrategy} from './real';
import {LoginStrategy} from './types';

export class LoginStrategyFactory {
  static new(isAPIMocked: boolean, context: RootPage): LoginStrategy {
    return isAPIMocked ? new MockedLoginStrategy() : new RealLoginStrategy(context);
  }
}
