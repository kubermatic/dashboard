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
import {environment} from '@environments/environment';
import {Observable} from 'rxjs';
import {Member, MemberModel} from '@shared/entity/member';
import {retry} from 'rxjs/operators';
import {AppConfigService} from '@app/config.service';

@Injectable()
export class MemberService {
  private readonly _restRoot = environment.restRoot;
  private readonly _retryTime = 3;
  private readonly _maxRetries = 5;

  constructor(
    private readonly _appConfigService: AppConfigService,
    private readonly _httpClient: HttpClient
  ) {}

  /**
   * Adds member into a project.
   *
   * @param model     member model
   * @param projectID ID of a project
   */
  add(model: MemberModel, projectID: string): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._httpClient.post<Member>(url, model);
  }

  /**
   * Lists members of a project.
   *
   * @param projectID ID of a project
   */
  list(projectID: string): Observable<Member[]> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._httpClient
      .get<Member[]>(url)
      .pipe(retry({delay: this._retryTime * this._appConfigService.getRefreshTimeBase(), count: this._maxRetries}));
  }

  /**
   * Edits member in a project.
   *
   * @param member    member
   * @param projectID ID of a project
   */
  edit(member: Member, projectID: string): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._httpClient.put<Member>(url, member);
  }

  /**
   * Removes member from a project.
   *
   * @param member    member
   * @param projectID ID of a project
   */
  remove(member: Member, projectID: string): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._httpClient.delete<Member>(url);
  }
}
