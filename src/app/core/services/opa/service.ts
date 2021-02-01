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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {Constraint, ConstraintTemplate} from '@shared/entity/opa';
import {Observable, Subject, timer, merge} from 'rxjs';
import {switchMap, shareReplay} from 'rxjs/operators';

@Injectable()
export class OPAService {
  private _newRestRoot: string = environment.newRestRoot;

  private readonly _refreshTime = 10;
  private _constraintTemplates$: Observable<ConstraintTemplate[]>;
  private _constraintTemplatesRefresh$ = new Subject<void>();
  private _constraints$: Observable<Constraint[]>;
  private _constraintsRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  constructor(private readonly _http: HttpClient, private readonly _appConfigService: AppConfigService) {}

  get constraintTemplates(): Observable<ConstraintTemplate[]> {
    if (!this._constraintTemplates$) {
      this._constraintTemplates$ = merge(this._constraintTemplatesRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getConstraintTemplates()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._constraintTemplates$;
  }

  private _getConstraintTemplates(): Observable<ConstraintTemplate[]> {
    const url = `${this._newRestRoot}/constrainttemplates`;
    return this._http.get<ConstraintTemplate[]>(url);
  }

  refreshConstraintTemplates(): void {
    this._constraintTemplatesRefresh$.next();
  }

  createConstraintTemplate(template: ConstraintTemplate): Observable<ConstraintTemplate> {
    const url = `${this._newRestRoot}/constrainttemplates`;
    return this._http.post<ConstraintTemplate>(url, template);
  }

  patchConstraintTemplate(ctName: string, patch: ConstraintTemplate): Observable<ConstraintTemplate> {
    const url = `${this._newRestRoot}/constrainttemplates/${ctName}`;
    return this._http.patch<ConstraintTemplate>(url, patch);
  }

  deleteConstraintTemplate(ctName: string): Observable<any> {
    const url = `${this._newRestRoot}/constrainttemplates/${ctName}`;
    return this._http.delete(url);
  }

  constraints(projectId: string, clusterId: string): Observable<Constraint[]> {
    if (!this._constraints$) {
      this._constraints$ = merge(this._constraintsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getConstraints(projectId, clusterId)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._constraints$;
  }

  private _getConstraints(projectId: string, clusterId: string): Observable<Constraint[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints`;
    return this._http.get<Constraint[]>(url);
  }

  refreshConstraint(): void {
    this._constraintsRefresh$.next();
  }

  createConstraint(projectId: string, clusterId: string, constraint: Constraint): Observable<Constraint> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints`;
    return this._http.post<Constraint>(url, constraint);
  }

  patchConstraint(projectId: string, clusterId: string, name: string, patch: Constraint): Observable<Constraint> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints/${name}`;
    return this._http.patch<Constraint>(url, patch);
  }

  deleteConstraint(projectId: string, clusterId: string, name: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints/${name}`;
    return this._http.delete(url);
  }
}
