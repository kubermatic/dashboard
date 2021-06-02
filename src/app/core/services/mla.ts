// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {AlertmanagerConfig} from '@shared/entity/mla';
import {Observable, Subject, merge, of} from 'rxjs';
import {switchMap, shareReplay, catchError} from 'rxjs/operators';

@Injectable()
export class MLAService {
  private _newRestRoot: string = environment.newRestRoot;

  private _alertmanagerConfig$ = new Map<string, Observable<AlertmanagerConfig>>();
  private _alertmanagerConfigRefresh$ = new Subject<void>();

  constructor(private readonly _http: HttpClient) {}

  alertmanagerConfig(projectId: string, clusterId: string): Observable<AlertmanagerConfig> {
    const id = `${projectId}-${clusterId}`;

    if (!this._alertmanagerConfig$.get(id)) {
      const _alertmanagerConfig$ = merge(of(false), this._alertmanagerConfigRefresh$)
        .pipe(switchMap(_ => this._getAlertmanagerConfig(projectId, clusterId)))
        .pipe(shareReplay(1));

      this._alertmanagerConfig$.set(id, _alertmanagerConfig$);
    }

    return this._alertmanagerConfig$.get(id);
  }

  private _getAlertmanagerConfig(projectId: string, clusterId: string): Observable<AlertmanagerConfig> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/alertmanager/config`;
    return this._http.get<AlertmanagerConfig>(url).pipe(catchError(() => of<AlertmanagerConfig>(undefined)));
  }

  refreshAlertmanagerConfig(): void {
    this._alertmanagerConfigRefresh$.next();
  }

  putAlertmanagerConfig(
    projectId: string,
    clusterId: string,
    config: AlertmanagerConfig
  ): Observable<AlertmanagerConfig> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/alertmanager/config`;
    return this._http.put<AlertmanagerConfig>(url, config);
  }

  resetAlertmanagerConfig(projectId: string, clusterId: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/alertmanager/config`;
    return this._http.delete(url);
  }
}
