import {LoginStrategy} from './types';

export class RealLoginStrategy implements LoginStrategy {
  login(): void {}

  logout(): void {}
}
