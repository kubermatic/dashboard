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

import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Provider} from './provider';
import {NutanixSubnet} from '@shared/entity/provider/nutanix';

export class Nutanix extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(Hetzner.Header.Username);
    this._setRequiredHeaders(Hetzner.Header.Password);
    this._setRequiredHeaders(Hetzner.Header.ProxyURL);
  }

  username(username: string): Nutanix {
    if (username) {
      this._headers = this._headers.set(Hetzner.Header.Username, username);
    }
    return this;
  }

  password(password: string): Nutanix {
    if (password) {
      this._headers = this._headers.set(Hetzner.Header.Password, password);
    }
    return this;
  }

  proxyURL(proxyURL: string): Nutanix {
    if (proxyURL) {
      this._headers = this._headers.set(Hetzner.Header.ProxyURL, proxyURL);
    }
    return this;
  }

  credential(credential: string): Nutanix {
    super._credential(credential);
    return this;
  }

  subnets(onLoadingCb: () => void = null): Observable<NutanixSubnet[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<NutanixSubnet[]>(this._url, {headers: this._headers});
  }
}

export namespace Hetzner {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    ProxyURL = 'ProxyURL',
  }
}
