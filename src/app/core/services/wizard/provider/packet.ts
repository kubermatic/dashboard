import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {PacketSize} from '../../../../shared/entity/packet/PacketSizeEntity';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';

export class Packet extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(Packet.Header.APIKey, Packet.Header.ProjectID);
  }

  credential(credential: string): Packet {
    super._credential(credential);
    return this;
  }

  apiKey(key: string): Packet {
    if (key) {
      this._headers = this._headers.set(Packet.Header.APIKey, key);
    }
    return this;
  }

  projectID(id: string): Packet {
    if (id) {
      this._headers = this._headers.set(Packet.Header.ProjectID, id);
    }
    return this;
  }

  flavors(): Observable<PacketSize[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    return this._http.get<PacketSize[]>(this._url, {headers: this._headers});
  }
}

export namespace Packet {
  export enum Header {APIKey = 'apiKey', ProjectID = 'projectID'}
}
