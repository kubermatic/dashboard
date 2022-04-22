import {Provider} from '@ctypes/provider';
import {Clusters} from './clusters';

export class Intercept {
  static Clusters(provider: Provider): Clusters {
    return new Clusters(provider);
  }
}
