import {MockedServiceAccountStrategy, MockedServiceAccountTokenStrategy} from './mocked';
import {RealServiceAccountStrategy, RealServiceAccountTokenStrategy} from './real';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './types';

export class ServiceAccountStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountStrategy {
    return isAPIMocked ? new MockedServiceAccountStrategy() : new RealServiceAccountStrategy();
  }
}

export class ServiceAccountTokenStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountTokenStrategy {
    return isAPIMocked ? new MockedServiceAccountTokenStrategy() : new RealServiceAccountTokenStrategy();
  }
}
