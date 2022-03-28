import {MockedServiceAccountStrategy, MockedServiceAccountTokenStrategy} from './mocked';
import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './types';

export class ServiceAccountStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountStrategy | undefined {
    return isAPIMocked ? new MockedServiceAccountStrategy() : undefined;
  }
}

export class ServiceAccountTokenStrategyFactory {
  static new(isAPIMocked: boolean): ServiceAccountTokenStrategy | undefined {
    return isAPIMocked ? new MockedServiceAccountTokenStrategy() : undefined;
  }
}
