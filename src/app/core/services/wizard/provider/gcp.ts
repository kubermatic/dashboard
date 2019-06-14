import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './base';

export class GCP extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string): GCP {
    super._credential(credential);
    return this;
  }

  diskTypes() {
    return NodeInstanceFlavors.GCP.DiskTypes;
  }

  machineTypes() {
    return NodeInstanceFlavors.GCP.MachineTypes;
  }
}
