import {ServiceAccountState, ServiceAccountTokenState} from './types';

export class RealServiceAccountState implements ServiceAccountState {
  onCreate(): void {}
  onDelete(): void {}
}

export class RealServiceAccountTokenState implements ServiceAccountTokenState {
  onCreate(): void {}
  onDelete(): void {}
}
