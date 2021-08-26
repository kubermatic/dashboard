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
import {merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, shareReplay, switchMapTo} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {ClusterTemplate, CreateTemplateInstances} from '@shared/entity/cluster-template';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class ClusterTemplateService {
  private readonly _refreshTime = 10;
  private _newRestRoot: string = environment.newRestRoot;
  private _templates$ = new Map<string, Observable<ClusterTemplate[]>>();
  private _template$ = new Map<string, Observable<ClusterTemplate>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);
  private _onUpdate = new Subject<void>();

  constructor(private readonly _http: HttpClient, private readonly _appConfig: AppConfigService) {}

  create(template: ClusterTemplate, projectID: string): Observable<ClusterTemplate> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates`;
    return this._http.post<ClusterTemplate>(url, template);
  }

  list(projectID: string): Observable<ClusterTemplate[]> {
    if (!this._templates$.get(projectID)) {
      const templates$ = merge(this._onUpdate, this._refreshTimer$).pipe(
        switchMapTo(this._list(projectID)),
        catchError(() => of<ClusterTemplate[]>()),
        shareReplay({refCount: true, bufferSize: 1})
      );
      this._templates$.set(projectID, templates$);
    }

    return this._templates$.get(projectID);
  }

  private _list(projectID: string): Observable<ClusterTemplate[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates`;
    return this._http.get<ClusterTemplate[]>(url);
  }

  get(projectID: string, templateID: string): Observable<ClusterTemplate> {
    const id = `${projectID}-${templateID}`;

    if (!this._template$.get(id)) {
      const template$ = merge(this._onUpdate, this._refreshTimer$).pipe(
        switchMapTo(this._get(projectID, templateID)),
        catchError(() => of<ClusterTemplate>()),
        shareReplay({refCount: true, bufferSize: 1})
      );

      this._template$.set(id, template$);
    }

    return this._template$.get(id);
  }

  private _get(projectID: string, templateID: string): Observable<ClusterTemplate> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}`;
    return this._http.get<ClusterTemplate>(url);
  }

  delete(projectID: string, templateID: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}`;
    return this._http.delete<any>(url);
  }

  createInstances(replicas: number, projectID: string, templateID: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}/instances`;
    return this._http.post<any>(url, {replicas: replicas} as CreateTemplateInstances);
  }
}
