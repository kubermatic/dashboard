import {ServiceAccountStrategy, ServiceAccountTokenStrategy} from './types';

export class RealServiceAccountStrategy implements ServiceAccountStrategy {
  onCreate(): void {}
  onDelete(): void {}
}

export class RealServiceAccountTokenStrategy implements ServiceAccountTokenStrategy {
  onCreate(): void {}
  onDelete(): void {}
}
