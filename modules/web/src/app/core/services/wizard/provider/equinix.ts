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
import {EquinixSize} from '@shared/entity/provider/equinix';

export class Equinix extends Provider {
  protected readonly _url = `${this._newRestRoot}/projects/${this._projectID}/providers/equinixmetal/sizes`;

  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(Equinix.Header.APIKey, Equinix.Header.ProjectID);
  }

  credential(credential: string): Equinix {
    super._credential(credential);
    return this;
  }

  apiKey(key: string): Equinix {
    if (key) {
      this._headers = this._headers.set(Equinix.Header.APIKey, key);
    }
    return this;
  }

  projectID(id: string): Equinix {
    if (id) {
      this._headers = this._headers.set(Equinix.Header.ProjectID, id);
    }
    return this;
  }

  datacenterName(datacenterName: string): Equinix {
    if (datacenterName) {
      this._headers = this._headers.set(Equinix.Header.DatacenterName, datacenterName);
    }
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<EquinixSize[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<EquinixSize[]>(this._url, {headers: this._headers});
  }
}

export namespace Equinix {
  export enum Header {
    APIKey = 'APIKey',
    ProjectID = 'EquinixProjectID',
    DatacenterName = 'DatacenterName',
  }
}
