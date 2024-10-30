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

import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {environment} from '@environments/environment';
import {merge, Observable, of, startWith, Subject, timer} from 'rxjs';
import {catchError, shareReplay, switchMap, tap} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';
import {ClusterServiceAccount} from '@shared/entity/rbac';

interface ServiceAccountBinding {
  serviceAccountNamespace: string;
  serviceAccount: string;
}

@Injectable()
export class ClusterServiceAccountService {
  private readonly _restRoot: string = environment.newRestRoot;
  private readonly _refreshTime = 10;
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);
  private _serviceAccountsMap$ = new Map<string, Observable<ClusterServiceAccount[]>>();
  private _previousServiceAccountsMap = new Map<string, ClusterServiceAccount[]>();
  private _refreshServiceAccounts = new Subject<void>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService
  ) {}

  get(projectID: string, clusterID: string): Observable<ClusterServiceAccount[]> {
    const mapKey = projectID + '-' + clusterID;
    if (!this._serviceAccountsMap$.has(mapKey)) {
      const serviceAccounts$ = merge(this._refreshTimer$, this._refreshServiceAccounts).pipe(
        switchMap(_ =>
          this._http
            .get<
              ClusterServiceAccount[]
            >(`${this._restRoot}/projects/${projectID}/clusters/${clusterID}/serviceaccount`)
            .pipe(catchError(_ => of(null)))
        ),
        shareReplay({
          refCount: true,
          bufferSize: 1,
        }),
        tap((serviceAccount: ClusterServiceAccount[]) => {
          this._previousServiceAccountsMap.set(mapKey, serviceAccount);
        })
      );

      this._serviceAccountsMap$.set(mapKey, serviceAccounts$);
    }
    if (this._previousServiceAccountsMap.has(mapKey)) {
      return this._serviceAccountsMap$.get(mapKey).pipe(startWith(this._previousServiceAccountsMap.get(mapKey)));
    }
    return this._serviceAccountsMap$.get(mapKey);
  }

  refreshServiceAccounts(): void {
    this._refreshServiceAccounts.next();
  }

  post(projectID: string, clusterID: string, serviceAccount: ClusterServiceAccount): Observable<ClusterServiceAccount> {
    return this._http.post<ClusterServiceAccount>(
      `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/serviceaccount`,
      serviceAccount
    );
  }

  bindServiceAccountToCluster(
    projectID: string,
    clusterID: string,
    roleID: string,
    serviceAccount: ClusterServiceAccount
  ): Observable<Record<string, never>> {
    const body: ServiceAccountBinding = {
      serviceAccount: serviceAccount.name,
      serviceAccountNamespace: serviceAccount.namespace,
    };
    return this._http.post<Record<string, never>>(
      `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/clusterroles/${roleID}/clusterbindings`,
      body
    );
  }

  bindServiceAccountToNamespace(
    projectID: string,
    clusterID: string,
    roleNamespace: string,
    roleID: string,
    serviceAccount: ClusterServiceAccount
  ): Observable<Record<string, never>> {
    const body: ServiceAccountBinding = {
      serviceAccount: serviceAccount.name,
      serviceAccountNamespace: serviceAccount.namespace,
    };
    return this._http.post<Record<string, never>>(
      `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/roles/${roleNamespace}/${roleID}/bindings`,
      body
    );
  }

  delete(
    projectID: string,
    clusterID: string,
    namespace: string,
    serviceAccountID: string
  ): Observable<Record<string, never>> {
    return this._http.delete<Record<string, never>>(
      `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/serviceaccount/${namespace}/${serviceAccountID}`
    );
  }

  getKubeconfigUrl(projectID: string, clusterID: string, namespace: string, serviceAccountID: string): string {
    return `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/serviceaccount/${namespace}/${serviceAccountID}/kubeconfig`;
  }
}
