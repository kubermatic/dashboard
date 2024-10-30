// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { HttpClient } from '@angular/common/http';
import {DigitaloceanSizes} from '@shared/entity/provider/digitalocean';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {EMPTY, Observable} from 'rxjs';
import {Provider} from './provider';

export class Digitalocean extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(Digitalocean.Header.Token);
  }

  token(token: string): Digitalocean {
    if (token) {
      this._headers = this._headers.set(Digitalocean.Header.Token, token);
    }
    return this;
  }

  credential(credential: string): Digitalocean {
    super._credential(credential);
    return this;
  }

  datacenterName(datacenterName: string): Digitalocean {
    if (datacenterName) {
      this._headers = this._headers.set(Digitalocean.Header.DatacenterName, datacenterName);
    }
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<DigitaloceanSizes> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<DigitaloceanSizes>(this._url, {
      headers: this._headers,
    });
  }
}

export namespace Digitalocean {
  export enum Header {
    Token = 'DoToken',
    DatacenterName = 'DatacenterName',
  }
}
