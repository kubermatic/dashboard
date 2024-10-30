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
import {
  NutanixCategory,
  NutanixCategoryValue,
  NutanixCluster,
  NutanixProject,
  NutanixSubnet,
} from '@shared/entity/provider/nutanix';

export class Nutanix extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(Nutanix.Header.NutanixUsername, Nutanix.Header.NutanixPassword);
  }

  username(username: string): Nutanix {
    if (username) {
      this._headers = this._headers.set(Nutanix.Header.NutanixUsername, username);
    }
    return this;
  }

  password(password: string): Nutanix {
    if (password) {
      this._headers = this._headers.set(Nutanix.Header.NutanixPassword, password);
    }
    return this;
  }

  proxyURL(proxyURL: string): Nutanix {
    if (proxyURL) {
      this._headers = this._headers.set(Nutanix.Header.NutanixProxyURL, proxyURL);
    }
    return this;
  }

  clusterName(clusterName: string): Nutanix {
    if (clusterName) {
      this._headers = this._headers.set(Nutanix.Header.NutanixCluster, clusterName);
    }
    return this;
  }

  projectName(projectName: string): Nutanix {
    if (projectName) {
      this._headers = this._headers.set(Nutanix.Header.NutanixProject, projectName);
    }
    return this;
  }

  credential(credential: string): Nutanix {
    super._credential(credential);
    return this;
  }

  clusters(seed: string, onLoadingCb: () => void = null): Observable<NutanixCluster[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/clusters`;
    return this._http.get<NutanixCluster[]>(url, {headers: this._headers});
  }

  projects(seed: string, onLoadingCb: () => void = null): Observable<NutanixProject[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/projects`;
    return this._http.get<NutanixProject[]>(url, {headers: this._headers});
  }

  subnets(seed: string, projectID: string, onLoadingCb: () => void = null): Observable<NutanixSubnet[]> {
    this._setRequiredHeaders(
      Nutanix.Header.NutanixUsername,
      Nutanix.Header.NutanixPassword,
      Nutanix.Header.NutanixCluster
    );
    if (!this._hasRequiredHeaders() || !seed) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${projectID}/providers/${this._provider}/${seed}/subnets`;
    return this._http.get<NutanixSubnet[]>(url, {headers: this._headers});
  }

  categories(seed: string, projectID: string, onLoadingCb: () => void = null): Observable<NutanixCategory[]> {
    this._setRequiredHeaders(Nutanix.Header.NutanixUsername, Nutanix.Header.NutanixPassword);
    if (!this._hasRequiredHeaders() || !seed) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${projectID}/providers/${this._provider}/${seed}/categories`;
    return this._http.get<NutanixCategory[]>(url, {headers: this._headers});
  }

  categoryValues(
    seed: string,
    projectID: string,
    categoryName: string,
    onLoadingCb: () => void = null
  ): Observable<NutanixCategoryValue[]> {
    this._setRequiredHeaders(Nutanix.Header.NutanixUsername, Nutanix.Header.NutanixPassword);
    if (!this._hasRequiredHeaders() || !seed) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${projectID}/providers/${this._provider}/${seed}/categories/${categoryName}/values`;
    return this._http.get<NutanixCategoryValue[]>(url, {headers: this._headers});
  }
}

export namespace Nutanix {
  export enum Header {
    NutanixUsername = 'NutanixUsername',
    NutanixPassword = 'NutanixPassword',
    NutanixProxyURL = 'NutanixProxyURL',
    NutanixProject = 'NutanixProject',
    NutanixCluster = 'NutanixCluster',
  }
}
