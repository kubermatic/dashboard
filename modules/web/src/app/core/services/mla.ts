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
import {AppConfigService} from '@app/config.service';
import {environment} from '@environments/environment';
import {AlertmanagerConfig, RuleGroup} from '@shared/entity/mla';
import {Observable, Subject, timer, merge, of} from 'rxjs';
import {switchMap, shareReplay, catchError} from 'rxjs/operators';

@Injectable()
export class MLAService {
  private readonly _refreshTime = 10;
  private _newRestRoot: string = environment.newRestRoot;
  private _refreshTimer$ = timer(0, this._appConfigService.getRefreshTimeBase() * this._refreshTime);

  private _alertmanagerConfig$ = new Map<string, Observable<AlertmanagerConfig>>();
  private _alertmanagerConfigRefresh$ = new Subject<void>();
  private _ruleGroups$ = new Map<string, Observable<RuleGroup[]>>();
  private _ruleGroupsRefresh$ = new Subject<void>();
  private _adminRuleGroups$ = new Map<string, Observable<RuleGroup[]>>();
  private _adminRuleGroupsRefresh$ = new Subject<void>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfigService: AppConfigService
  ) {}

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

  resetAlertmanagerConfig(projectId: string, clusterId: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/alertmanager/config`;
    return this._http.delete<void>(url);
  }

  ruleGroups(projectId: string, clusterId: string): Observable<RuleGroup[]> {
    const id = `${projectId}-${clusterId}`;

    if (!this._ruleGroups$.get(id)) {
      const _ruleGroups$ = merge(this._ruleGroupsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getRuleGroups(projectId, clusterId)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));

      this._ruleGroups$.set(id, _ruleGroups$);
    }

    return this._ruleGroups$.get(id);
  }

  private _getRuleGroups(projectId: string, clusterId: string): Observable<RuleGroup[]> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/rulegroups`;
    return this._http.get<RuleGroup[]>(url).pipe(catchError(() => of<RuleGroup[]>([])));
  }

  refreshRuleGroups(): void {
    this._ruleGroupsRefresh$.next();
  }

  createRuleGroup(projectId: string, clusterId: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/rulegroups`;
    return this._http.post<RuleGroup>(url, ruleGroup);
  }

  editRuleGroup(projectId: string, clusterId: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/rulegroups/${ruleGroup.name}`;
    return this._http.put<RuleGroup>(url, ruleGroup);
  }

  deleteRuleGroup(projectId: string, clusterId: string, ruleGroupName: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectId}/clusters/${clusterId}/rulegroups/${ruleGroupName}`;
    return this._http.delete<void>(url);
  }

  adminRuleGroups(seed: string): Observable<RuleGroup[]> {
    const id = `${seed}`;

    if (!this._adminRuleGroups$.get(id)) {
      const _adminRuleGroups$ = merge(this._adminRuleGroupsRefresh$, this._refreshTimer$)
        .pipe(switchMap(_ => this._getAdminRuleGroups(seed)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));

      this._adminRuleGroups$.set(id, _adminRuleGroups$);
    }
    return this._adminRuleGroups$.get(id);
  }

  private _getAdminRuleGroups(seedName: string): Observable<RuleGroup[]> {
    const url = `${this._newRestRoot}/seeds/${seedName}/rulegroups`;
    return this._http.get<RuleGroup[]>(url).pipe(catchError(() => of<RuleGroup[]>()));
  }

  refreshAdminRuleGroups(): void {
    this._adminRuleGroupsRefresh$.next();
  }

  createAdminRuleGroup(seedName: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    const url = `${this._newRestRoot}/seeds/${seedName}/rulegroups`;
    return this._http.post<RuleGroup>(url, ruleGroup);
  }

  editAdminRuleGroup(seedName: string, ruleGroup: RuleGroup): Observable<RuleGroup> {
    const url = `${this._newRestRoot}/seeds/${seedName}/rulegroups/${ruleGroup.name}`;
    return this._http.put<RuleGroup>(url, ruleGroup);
  }

  deleteAdminRuleGroup(seedName: string, ruleGroupName: string): Observable<void> {
    const url = `${this._newRestRoot}/seeds/${seedName}/rulegroups/${ruleGroupName}`;
    return this._http.delete<void>(url);
  }
}
