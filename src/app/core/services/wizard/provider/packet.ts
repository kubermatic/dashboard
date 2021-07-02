// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {NodeProvider} from '@shared/model/NodeProviderConstants';

import {Provider} from './provider';
import {PacketSize} from '@shared/entity/provider/packet';

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

  flavors(onLoadingCb: () => void = null): Observable<PacketSize[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<PacketSize[]>(this._url, {headers: this._headers});
  }
}

export namespace Packet {
  export enum Header {
    APIKey = 'apiKey',
    ProjectID = 'projectID',
  }
}
