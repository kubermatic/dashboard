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
import {Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {Application, ApplicationDefinition} from '@shared/entity/application';
import {Observable, of, timer} from 'rxjs';
import {catchError, shareReplay, switchMap} from 'rxjs/operators';

@Injectable()
export class ApplicationService {
  private readonly _restRoot: string = environment.newRestRoot;
  private readonly _refreshTime = 30;
  private readonly _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _applicationDefinitions$: Observable<ApplicationDefinition[]>;

  constructor(private readonly _appConfigService: AppConfigService, private readonly _httpClient: HttpClient) {}

  applicationDefinitions(): Observable<ApplicationDefinition[]> {
    if (!this._applicationDefinitions$) {
      this._applicationDefinitions$ = this._refreshTimer$
        .pipe(
          switchMap(() =>
            this._httpClient
              .get<ApplicationDefinition[]>(`${this._restRoot}/applicationdefinitions`)
              .pipe(catchError(() => of<ApplicationDefinition[]>([])))
          )
        )
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._applicationDefinitions$;
  }

  add(application: Application, projectID: string, clusterID: string): Observable<Application> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations`;
    return this._httpClient.post<Application>(url, application);
  }

  list(projectID: string, clusterID: string): Observable<Application[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations`;
    return this._httpClient.get<Application[]>(url).pipe(catchError(() => of<Application[]>([])));
  }

  put(application: Application, projectID: string, clusterID: string): Observable<Application> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${application.namespace}/${application.name}`;
    return this._httpClient.put<Application>(url, application);
  }

  delete(application: Application, projectID: string, clusterID: string): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${application.namespace}/${application.name}`;
    return this._httpClient.delete<void>(url);
  }
}
