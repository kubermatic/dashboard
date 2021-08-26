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
import {Observable, of} from 'rxjs';
import {catchError, shareReplay} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {ClusterTemplate, CreateTemplateInstances} from '@shared/entity/cluster-template';

@Injectable()
export class ClusterTemplateService {
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  create(template: ClusterTemplate, projectID: string): Observable<ClusterTemplate> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates`;
    return this._http.post<ClusterTemplate>(url, template);
  }

  list(projectID: string): Observable<ClusterTemplate[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates`;
    return this._http.get<ClusterTemplate[]>(url).pipe(
      catchError(() => of<ClusterTemplate[]>()),
      shareReplay({refCount: true, bufferSize: 1})
    );
  }

  get(projectID: string, templateID: string): Observable<ClusterTemplate> {
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
