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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {Constraint, ConstraintTemplate, GatekeeperConfig} from '@shared/entity/opa';
import {Observable, Subject, timer, merge, of} from 'rxjs';
import {switchMap, shareReplay, catchError} from 'rxjs/operators';

@Injectable()
export class OPAService {
  private _newRestRoot: string = environment.newRestRoot;

  private readonly _refreshTime = 10;
  private _constraintTemplates$: Observable<ConstraintTemplate[]>;
  private _constraintTemplatesRefresh$ = new Subject<void>();
  private _constraints$ = new Map<string, Observable<Constraint[]>>();
  private _constraintsRefresh$ = new Subject<void>();
  private _defaultConstraints$: Observable<Constraint[]>;
  private _defaultConstraintsRefresh$ = new Subject<void>();
  private _gatekeeperConfig$ = new Map<string, Observable<GatekeeperConfig>>();
  private _gatekeeperConfigRefresh$ = new Subject<void>();
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);
  private _violationPageIndex = new Map<string, number>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

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

  deleteConstraintTemplate(ctName: string): Observable<void> {
    const url = `${this._newRestRoot}/constrainttemplates/${ctName}`;
    return this._http.delete<void>(url);
  }

  constraints(projectId: string, clusterId: string): Observable<Constraint[]> {
    const id = `${projectId}-${clusterId}`;

    if (!this._constraints$.get(id)) {
      const _constraints$ = merge(this._constraintsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getConstraints(projectId, clusterId)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));

      this._constraints$.set(id, _constraints$);
    }

    return this._constraints$.get(id);
  }

  private _getConstraints(projectId: string, clusterId: string): Observable<Constraint[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints`;
    return this._http.get<Constraint[]>(url).pipe(catchError(() => of<Constraint[]>([])));
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

  deleteConstraint(projectId: string, clusterId: string, name: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/constraints/${name}`;
    return this._http.delete<void>(url);
  }

  get defaultConstraints(): Observable<Constraint[]> {
    if (!this._defaultConstraints$) {
      this._defaultConstraints$ = merge(this._defaultConstraintsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getDefaultConstraints()))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }

    return this._defaultConstraints$;
  }

  private _getDefaultConstraints(): Observable<Constraint[]> {
    const url = `${this._newRestRoot}/constraints`;
    return this._http.get<Constraint[]>(url).pipe(catchError(() => of<Constraint[]>()));
  }

  refreshDefaultConstraints(): void {
    this._defaultConstraintsRefresh$.next();
  }

  createDefaultConstraint(constraint: Constraint): Observable<Constraint> {
    const url = `${this._newRestRoot}/constraints`;
    return this._http.post<Constraint>(url, constraint);
  }

  patchDefaultConstraint(name: string, patch: Constraint): Observable<Constraint> {
    const url = `${this._newRestRoot}/constraints/${name}`;
    return this._http.patch<Constraint>(url, patch);
  }

  deleteDefaultConstraint(name: string): Observable<void> {
    const url = `${this._newRestRoot}/constraints/${name}`;
    return this._http.delete<void>(url);
  }

  gatekeeperConfig(projectId: string, clusterId: string): Observable<GatekeeperConfig> {
    const id = `${projectId}-${clusterId}`;

    if (!this._gatekeeperConfig$.get(id)) {
      const _gatekeeperConfig$ = merge(of(false), this._gatekeeperConfigRefresh$)
        .pipe(switchMap(_ => this._getGatekeeperConfig(projectId, clusterId)))
        .pipe(shareReplay(1));

      this._gatekeeperConfig$.set(id, _gatekeeperConfig$);
    }

    return this._gatekeeperConfig$.get(id);
  }

  private _getGatekeeperConfig(projectId: string, clusterId: string): Observable<GatekeeperConfig> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/gatekeeper/config`;
    return this._http.get<GatekeeperConfig>(url).pipe(catchError(() => of<GatekeeperConfig>(undefined)));
  }

  refreshGatekeeperConfig(): void {
    this._gatekeeperConfigRefresh$.next();
  }

  createGatekeeperConfig(projectId: string, clusterId: string, config: GatekeeperConfig): Observable<GatekeeperConfig> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/gatekeeper/config`;
    return this._http.post<GatekeeperConfig>(url, config);
  }

  patchGatekeeperConfig(projectId: string, clusterId: string, patch: GatekeeperConfig): Observable<GatekeeperConfig> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/gatekeeper/config`;
    return this._http.patch<GatekeeperConfig>(url, patch);
  }

  deleteGatekeeperConfig(projectId: string, clusterId: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/gatekeeper/config`;
    return this._http.delete<void>(url);
  }

  getViolationPageIndex(projectId: string, clusterId: string, constraintName: string): number {
    const id = `${projectId}-${clusterId}-${constraintName}`;
    return this._violationPageIndex.get(id);
  }

  saveViolationPageIndex(projectId: string, clusterId: string, constraintName: string, pageIndex: number): void {
    const id = `${projectId}-${clusterId}-${constraintName}`;
    this._violationPageIndex.set(id, pageIndex);
  }
}
