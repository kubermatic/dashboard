import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class VSphere extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string): VSphere {
    super._credential(credential);
    return this;
  }

  flavors(): string[] {
    return NodeInstanceFlavors.Packet;
  }
}
