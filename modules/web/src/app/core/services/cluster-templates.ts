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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {BehaviorSubject, merge, Observable, of, Subject, timer} from 'rxjs';
import {catchError, shareReplay, switchMapTo} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {ClusterTemplate, ClusterTemplateInstance, CreateTemplateInstances} from '@shared/entity/cluster-template';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class ClusterTemplateService {
  private readonly _refreshTime = 10;
  templateChanges = new BehaviorSubject<ClusterTemplate>(undefined);
  replicasChanges = new BehaviorSubject<number>(undefined);
  private _template: ClusterTemplate;
  private _templateStepValidity = false;
  private _replicas: number;
  private _clusterStepValidity = false;
  private _newRestRoot: string = environment.newRestRoot;
  private _templates$ = new Map<string, Observable<ClusterTemplate[]>>();
  private _template$ = new Map<string, Observable<ClusterTemplate>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * this._refreshTime);
  private _onUpdate = new Subject<void>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService
  ) {}

  create(template: ClusterTemplate, projectID: string): Observable<ClusterTemplate> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates`;
    return this._http.post<ClusterTemplate>(url, template);
  }

  update(template: ClusterTemplate, projectID: string, templateID: string): Observable<ClusterTemplate> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}`;
    return this._http.put<ClusterTemplate>(url, template);
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

  delete(projectID: string, templateID: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}`;
    return this._http.delete<void>(url);
  }

  createInstances(replicas: number, projectID: string, templateID: string): Observable<ClusterTemplateInstance> {
    const url = `${this._newRestRoot}/projects/${projectID}/clustertemplates/${templateID}/instances`;
    return this._http.post<ClusterTemplateInstance>(url, {replicas: replicas} as CreateTemplateInstances);
  }

  get template(): ClusterTemplate {
    return this._template;
  }

  set template(template: ClusterTemplate) {
    this._template = template;
    this.templateChanges.next(this._template);
  }

  get replicas(): number {
    return this._replicas;
  }

  set replicas(replicas: number) {
    this._replicas = replicas;
    this.replicasChanges.next(this._replicas);
  }

  get isTemplateStepValid(): boolean {
    return this._templateStepValidity;
  }

  set templateStepValidity(valid: boolean) {
    this._templateStepValidity = valid;
  }

  get isClusterStepValid(): boolean {
    return this._clusterStepValidity;
  }

  set clusterStepValidity(valid: boolean) {
    this._clusterStepValidity = valid;
  }

  reset(): void {
    this.template = undefined;
    this.replicas = 1;
    this.templateStepValidity = false;
    this.clusterStepValidity = false;
  }
}
