import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {GCPDiskType, GCPMachineSize, GCPZone} from '../../../../shared/entity/provider/gcp/GCP';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';

export class GCP extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(GCP.Header.ServiceAccount);
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

  diskTypes(): Observable<GCPDiskType[]> {
    if (!this._hasRequiredHeaders() && this._headers.has(GCP.Header.Zone)) {
      return EMPTY;
    }
    const url = `${this._restRoot}/providers/${this._provider}/disktypes`;
    return this._http.get<GCPDiskType[]>(url, {headers: this._headers});
  }

  machineTypes(): Observable<GCPMachineSize[]> {
    if (!this._hasRequiredHeaders() && this._headers.has(GCP.Header.Zone)) {
      return EMPTY;
    }
    return this._http.get<GCPMachineSize[]>(this._url, {headers: this._headers});
  }

  zones(dc: string): Observable<GCPZone[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }
    const url = `${this._restRoot}/providers/${this._provider}/${dc}/zones`;
    return this._http.get<GCPZone[]>(url, {headers: this._headers});
  }
}

export namespace GCP {
  export enum Header {
    ServiceAccount = 'ServiceAccount',
    Zone = 'Zone',
  }
}
