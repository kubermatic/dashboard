import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavor, NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class Hetzner extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string): Hetzner {
    super._credential(credential);
    return this;
  }

  flavors(): NodeInstanceFlavor[] {
    return NodeInstanceFlavors.Hetzner;
  }
}
