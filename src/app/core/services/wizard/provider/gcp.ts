import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {GCPMachineSize} from '../../../../shared/entity/provider/gcp/GCP';
import {NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';

export class GCP extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(GCP.Header.ServiceAccount, GCP.Header.Zone);
  }

  serviceAccount(serviceAccount: string): GCP {
    if (serviceAccount) {
      this._headers = this._headers.set(GCP.Header.ServiceAccount, serviceAccount);
    }
    return this;
  }

  zone(zone: string): GCP {
    if (zone) {
      this._headers = this._headers.set(GCP.Header.Zone, zone);
    }
    return this;
  }

  credential(credential: string): GCP {
    super._credential(credential);
    return this;
  }

  diskTypes(): string[] {
    return NodeInstanceFlavors.GCP.DiskTypes;
  }

  machineTypes(): Observable<GCPMachineSize[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }
    return this._http.get<GCPMachineSize[]>(this._url, {headers: this._headers});
  }

  zones(): string[] {
    return NodeInstanceFlavors.GCP.Zones;
  }
}

export namespace GCP {
  export enum Header {
    ServiceAccount = 'ServiceAccount',
    Zone = 'Zone',
  }
}
