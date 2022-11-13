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
import {VSphereDatastores, VSphereFolder, VSphereNetwork} from '@shared/entity/provider/vsphere';
import {map} from 'rxjs/operators';

export class VSphere extends Provider {
  private readonly _networksUrl = `${this._restRoot}/providers/vsphere/networks`;
  private readonly _foldersUrl = `${this._restRoot}/providers/vsphere/folders`;

  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(VSphere.Header.Username, VSphere.Header.Password, VSphere.Header.Datacenter);
  }

  username(username: string): VSphere {
    if (username) {
      this._headers = this._headers.set(VSphere.Header.Username, username);
    }
    return this;
  }

  password(password: string): VSphere {
    if (password) {
      this._headers = this._headers.set(VSphere.Header.Password, password);
    }
    return this;
  }

  datacenter(datacenter: string): VSphere {
    if (datacenter) {
      this._headers = this._headers.set(VSphere.Header.Datacenter, datacenter);
    }
    return this;
  }

  credential(credential: string): VSphere {
    super._credential(credential);
    return this;
  }

  networks(onLoadingCb: () => void = null): Observable<VSphereNetwork[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereNetwork[]>(this._networksUrl, {
      headers: this._headers,
    });
  }

  folders(onLoadingCb: () => void = null): Observable<VSphereFolder[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereFolder[]>(this._foldersUrl, {
      headers: this._headers,
    });
  }

  datastores(onLoadingCb: () => void = null): Observable<string[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/providers/${this._provider}/datastores`;
    return this._http
      .get<VSphereDatastores>(url, {headers: this._headers})
      .pipe(map(datastores => datastores.datastores));
  }
}

export namespace VSphere {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    Datacenter = 'DatacenterName',
  }
}
