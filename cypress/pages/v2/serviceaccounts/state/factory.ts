import {MockedServiceAccountState, MockedServiceAccountTokenState} from './mocked';
import {RealServiceAccountState, RealServiceAccountTokenState} from './real';
import {ServiceAccountState, ServiceAccountTokenState} from './types';

export class ServiceAccountStateFactory {
  static new(isAPIMocked: boolean): ServiceAccountState {
    return isAPIMocked ? new MockedServiceAccountState() : new RealServiceAccountState();
  }
}

export class ServiceAccountTokenStateFactory {
  static new(isAPIMocked: boolean): ServiceAccountTokenState {
    return isAPIMocked ? new MockedServiceAccountTokenState() : new RealServiceAccountTokenState();
  }
}
