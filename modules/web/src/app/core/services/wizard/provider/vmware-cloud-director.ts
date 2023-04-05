// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {
  VMwareCloudDirectorCatalog,
  VMwareCloudDirectorNetwork,
  VMwareCloudDirectorStorageProfile,
  VMwareCloudDirectorTemplate,
} from '@shared/entity/provider/vmware-cloud-director';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {EMPTY, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {Provider} from './provider';

export class VMwareCloudDirector extends Provider {
  private apiTokenCredentials = false;
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(
      VMwareCloudDirector.Header.Username,
      VMwareCloudDirector.Header.Password,
      VMwareCloudDirector.Header.Organization,
      VMwareCloudDirector.Header.VDC
    );
  }

  username(username: string): VMwareCloudDirector {
    if (username) {
      this._headers = this._headers.set(VMwareCloudDirector.Header.Username, username);
    }
    return this;
  }

  password(password: string): VMwareCloudDirector {
    if (password) {
      this._headers = this._headers.set(VMwareCloudDirector.Header.Password, password);
    }
    return this;
  }

  apiToken(apiToken: string): VMwareCloudDirector {
    if (apiToken) {
      this.apiTokenCredentials = true;
      this._headers = this._headers.set(VMwareCloudDirector.Header.APIToken, apiToken);
    }
    return this;
  }

  organization(organization: string): VMwareCloudDirector {
    if (organization) {
      this._headers = this._headers.set(VMwareCloudDirector.Header.Organization, organization);
    }
    return this;
  }

  vdc(vdc: string): VMwareCloudDirector {
    if (vdc) {
      this._headers = this._headers.set(VMwareCloudDirector.Header.VDC, vdc);
    }
    return this;
  }

  credential(credential: string): VMwareCloudDirector {
    super._credential(credential);
    return this;
  }

  networks(seed: string, onLoadingCb: () => void = null): Observable<VMwareCloudDirectorNetwork[]> {
    if (!this.hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/networks`;
    return this._http
      .get<VMwareCloudDirectorNetwork[]>(url, {headers: this._headers})
      .pipe(catchError(_ => of<VMwareCloudDirectorNetwork[]>([])));
  }

  storageProfiles(seed: string, onLoadingCb: () => void = null): Observable<VMwareCloudDirectorStorageProfile[]> {
    if (!this.hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/storageprofiles`;
    return this._http.get<VMwareCloudDirectorStorageProfile[]>(url, {headers: this._headers});
  }

  catalogs(seed: string, onLoadingCb: () => void = null): Observable<VMwareCloudDirectorCatalog[]> {
    if (!this.hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/catalogs`;
    return this._http.get<VMwareCloudDirectorCatalog[]>(url, {headers: this._headers});
  }

  templates(
    seed: string,
    catalogName: string,
    onLoadingCb: () => void = null
  ): Observable<VMwareCloudDirectorTemplate[]> {
    if (!this.hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/templates/${catalogName}`;
    return this._http.get<VMwareCloudDirectorTemplate[]>(url, {headers: this._headers});
  }

  private hasRequiredHeaders(): boolean {
    if (this.apiTokenCredentials) {
      this._setRequiredHeaders(
        VMwareCloudDirector.Header.APIToken,
        VMwareCloudDirector.Header.Organization,
        VMwareCloudDirector.Header.VDC
      );
      this._cleanupOptionalHeaders();
    }

    return this._hasRequiredHeaders();
  }
}

export namespace VMwareCloudDirector {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    APIToken = 'APIToken',
    Organization = 'Organization',
    VDC = 'VDC',
  }
}
