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
import {EventEmitter, Injectable} from '@angular/core';
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {
  Application,
  ApplicationDefinition,
  ApplicationSettings,
  getApplicationLogoData,
} from '@shared/entity/application';
import _ from 'lodash';
import {Observable, of, timer} from 'rxjs';
import {catchError, map, shareReplay, switchMap, tap} from 'rxjs/operators';

@Injectable()
export class ApplicationService {
  private _applications: Application[] = [];
  private _applicationDefinitions: ApplicationDefinition[] = [];
  private readonly _restRoot: string = environment.newRestRoot;
  private readonly _refreshTime = 30;
  private readonly _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _applicationDefinitions$: Observable<ApplicationDefinition[]>;
  readonly applicationChanges = new EventEmitter<Application[]>();

  constructor(
    private readonly _appConfigService: AppConfigService,
    private readonly _httpClient: HttpClient
  ) {}

  get applications(): Application[] {
    return this._applications;
  }

  get applicationDefinitions(): ApplicationDefinition[] {
    return this._applicationDefinitions;
  }

  set applications(applications: Application[]) {
    this._applications = applications;
    this.applicationChanges.emit(this._applications);
  }

  getApplicationSettings(): Observable<ApplicationSettings> {
    const url = `${this._restRoot}/applicationsettings`;
    return this._httpClient.get<ApplicationSettings>(url).pipe(catchError(() => of({} as ApplicationSettings)));
  }

  listApplicationDefinitions(): Observable<ApplicationDefinition[]> {
    if (!this._applicationDefinitions$) {
      this._applicationDefinitions$ = this._refreshTimer$
        .pipe(
          switchMap(() =>
            this._httpClient
              .get<ApplicationDefinition[]>(`${this._restRoot}/applicationdefinitions`)
              .pipe(catchError(() => of<ApplicationDefinition[]>([])))
              .pipe(
                map(appDefs => {
                  this._applicationDefinitions = appDefs.map(appDef => {
                    const logoData = getApplicationLogoData(appDef);
                    if (logoData) {
                      appDef.spec.logoData = logoData;
                    }
                    const oldAppDef = this._applicationDefinitions.find(item => item.name === appDef.name);
                    if (oldAppDef) {
                      return _.merge(oldAppDef, appDef);
                    }
                    return appDef;
                  });
                  return this._applicationDefinitions;
                })
              )
          )
        )
        .pipe(map(applications => applications.sort((a, b) => a.name.localeCompare(b.name))))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this._applicationDefinitions$;
  }

  getApplicationDefinition(name: string): Observable<ApplicationDefinition> {
    const url = `${this._restRoot}/applicationdefinitions/${name}`;
    return this._httpClient.get<ApplicationDefinition>(url).pipe(
      tap(appDef => {
        const logoData = getApplicationLogoData(appDef);
        if (logoData) {
          appDef.spec.logoData = logoData;
        }
        this._applicationDefinitions = this._applicationDefinitions.map(item => {
          if (item.name === name) {
            return _.merge(item, appDef);
          }
          return item;
        });
      })
    );
  }

  patchApplicationDefinition(name: string, patch: ApplicationDefinition): Observable<ApplicationDefinition> {
    const url = `${this._restRoot}/applicationdefinitions/${name}`;
    return this._httpClient.patch<ApplicationDefinition>(url, patch);
  }

  add(application: Application, projectID: string, clusterID: string): Observable<Application> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations`;
    return this._httpClient.post<Application>(url, application);
  }

  list(projectID: string, clusterID: string): Observable<Application[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations`;
    return this._httpClient.get<Application[]>(url).pipe(catchError(() => of<Application[]>([])));
  }

  getApplication(application: Application, projectID: string, clusterID: string): Observable<Application> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${application.namespace}/${application.name}`;
    return this._httpClient.get<Application>(url);
  }

  put(application: Application, projectID: string, clusterID: string): Observable<Application> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${application.namespace}/${application.name}`;
    return this._httpClient.put<Application>(url, application);
  }

  delete(application: Application, projectID: string, clusterID: string): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/applicationinstallations/${application.namespace}/${application.name}`;
    return this._httpClient.delete<void>(url);
  }

  reset(): void {
    this._applications = [];
  }
}
