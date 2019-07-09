import {HttpClient} from '@angular/common/http';
import {NodeInstanceFlavor, NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class GCP extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);
  }

  credential(credential: string): GCP {
    super._credential(credential);
    return this;
  }

  diskTypes(): string[] {
    return NodeInstanceFlavors.GCP.DiskTypes;
  }

  machineTypes(): NodeInstanceFlavor[] {
    return NodeInstanceFlavors.GCP.MachineTypes;
  }

  zones(): string[] {
    return NodeInstanceFlavors.GCP.Zones;
  }
}
