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
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {
  CreateTokenEntity,
  ServiceAccount,
  ServiceAccountModel,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '@shared/entity/service-account';
import {Observable} from 'rxjs';

@Injectable()
export class ServiceAccountService {
  private readonly _restRoot: string = environment.restRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  get(projectID: string): Observable<ServiceAccount[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._httpClient.get<ServiceAccount[]>(url);
  }

  create(projectID: string, sa: ServiceAccountModel): Observable<ServiceAccount> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts`;
    return this._httpClient.post<ServiceAccount>(url, sa);
  }

  edit(projectID: string, sa: ServiceAccount): Observable<ServiceAccount> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}`;
    return this._httpClient.put<ServiceAccount>(url, sa);
  }

  delete(projectID: string, sa: ServiceAccount): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}`;
    return this._httpClient.delete<void>(url);
  }

  getTokens(projectID: string, sa: ServiceAccount): Observable<ServiceAccountToken[]> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}/tokens`;
    return this._httpClient.get<ServiceAccountToken[]>(url);
  }

  createToken(projectID: string, sa: ServiceAccount, token: CreateTokenEntity): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}/tokens`;
    return this._httpClient.post<ServiceAccountToken>(url, token);
  }

  patchToken(
    projectID: string,
    sa: ServiceAccount,
    token: ServiceAccountToken,
    patch: ServiceAccountTokenPatch
  ): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}/tokens/${token.id}`;
    return this._httpClient.patch<ServiceAccountToken>(url, patch);
  }

  regenerateToken(projectID: string, sa: ServiceAccount, token: ServiceAccountToken): Observable<ServiceAccountToken> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}/tokens/${token.id}`;
    return this._httpClient.put<ServiceAccountToken>(url, token);
  }

  deleteToken(projectID: string, sa: ServiceAccount, token: ServiceAccountToken): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/serviceaccounts/${sa.id}/tokens/${token.id}`;
    return this._httpClient.delete<void>(url);
  }
}
