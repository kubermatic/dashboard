import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class AWS extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string) {
    super._credential(credential);
    return this;
  }

  flavors() {
    return NodeInstanceFlavors.AWS;
  }
}
