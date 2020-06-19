import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';
import {GCPDiskType, GCPMachineSize, GCPNetwork, GCPSubnetwork, GCPZone} from '../../../../shared/entity/provider/gcp';

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

  network(network: string): GCP {
    if (network) {
      this._headers = this._headers.set(GCP.Header.Network, network);
    }
    return this;
  }

  credential(credential: string): GCP {
    super._credential(credential);
    return this;
  }

  diskTypes(onLoadingCb: () => void = null): Observable<GCPDiskType[]> {
    if (!this._hasRequiredHeaders() && this._headers.has(GCP.Header.Zone)) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/disktypes`;
    return this._http.get<GCPDiskType[]>(url, {headers: this._headers});
  }

  machineTypes(onLoadingCb: () => void = null): Observable<GCPMachineSize[]> {
    if (!this._hasRequiredHeaders() && this._headers.has(GCP.Header.Zone)) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<GCPMachineSize[]>(this._url, {
      headers: this._headers,
    });
  }

  zones(dc: string, onLoadingCb: () => void = null): Observable<GCPZone[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/${dc}/zones`;
    return this._http.get<GCPZone[]>(url, {headers: this._headers});
  }

  networks(onLoadingCb: () => void = null): Observable<GCPNetwork[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/networks`;
    return this._http.get<GCPNetwork[]>(url, {headers: this._headers});
  }

  subnetworks(dc: string, onLoadingCb: () => void = null): Observable<GCPSubnetwork[]> {
    this._setRequiredHeaders(GCP.Header.ServiceAccount, GCP.Header.Network);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/${dc}/subnetworks`;
    return this._http.get<GCPSubnetwork[]>(url, {headers: this._headers});
  }
}

export namespace GCP {
  export enum Header {
    ServiceAccount = 'ServiceAccount',
    Zone = 'Zone',
    Network = 'Network',
  }
}
