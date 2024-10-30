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
import {VSphereTag} from '@app/shared/entity/node';
import {
  VSphereDatastores,
  VSphereFolder,
  VSphereNetwork,
  VSphereTagCategory,
  VSphereVMGroup,
} from '@shared/entity/provider/vsphere';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {EMPTY, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Provider} from './provider';

export class VSphere extends Provider {
  private readonly _networksUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/vsphere/networks`;
  private readonly _foldersUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/vsphere/folders`;
  private readonly _tagCategoriesUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/vsphere/tagcategories`;
  private readonly _vmGroupsUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/vsphere/vmgroups`;

  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

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

  tagCategories(onLoadingCb: () => void = null): Observable<VSphereTagCategory[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereTagCategory[]>(this._tagCategoriesUrl, {
      headers: this._headers,
    });
  }

  tags(tagCategory: string, onLoadingCb: () => void = null): Observable<VSphereTag[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereTag[]>(`${this._tagCategoriesUrl}/${tagCategory}/tags`, {
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

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/datastores`;
    return this._http
      .get<VSphereDatastores>(url, {headers: this._headers})
      .pipe(map(datastores => datastores.datastores));
  }

  vmGroups(onLoadingCb: () => void = null): Observable<VSphereVMGroup[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereVMGroup[]>(this._vmGroupsUrl, {
      headers: this._headers,
    });
  }
}

export namespace VSphere {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    Datacenter = 'DatacenterName',
  }
}
