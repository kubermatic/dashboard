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
import {EMPTY, Observable} from 'rxjs';

import {NodeProvider} from '@shared/model/NodeProviderConstants';

import {Provider} from './provider';
import {AnexiaDiskType, AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';

export class Anexia extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(Anexia.Header.Token);
  }

  credential(credential: string): Anexia {
    super._credential(credential);
    return this;
  }

  token(token: string): Anexia {
    if (token) {
      this._headers = this._headers.set(Anexia.Header.Token, token);
    }
    return this;
  }

  location(location: string): Anexia {
    if (location) {
      this._headers = this._headers.set(Anexia.Header.Location, location);
    }
    return this;
  }

  vlans(onLoadingCb: () => void = null): Observable<AnexiaVlan[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/vlans`;
    return this._http.get<AnexiaVlan[]>(url, {headers: this._headers});
  }

  templates(onLoadingCb: () => void = null): Observable<AnexiaTemplate[]> {
    this._setRequiredHeaders(Anexia.Header.Token, Anexia.Header.Location);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/templates`;
    return this._http.get<AnexiaTemplate[]>(url, {headers: this._headers});
  }

  diskTypes(onLoadingCb: () => void = null): Observable<AnexiaDiskType[]> {
    this._setRequiredHeaders(Anexia.Header.Token, Anexia.Header.Location);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/disk-types`;
    return this._http.get<AnexiaDiskType[]>(url, {headers: this._headers});
  }
}

export namespace Anexia {
  export enum Header {
    Token = 'Token',
    Location = 'Location',
  }
}
