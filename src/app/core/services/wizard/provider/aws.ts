import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavor, NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class AWS extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string): AWS {
    super._credential(credential);
    return this;
  }

  flavors(): NodeInstanceFlavor[] {
    return NodeInstanceFlavors.AWS;
  }
}
