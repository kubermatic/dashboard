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
import {environment} from '@environments/environment';
import {Observable} from 'rxjs';
import {CreateMember, Member} from '@shared/entity/member';

@Injectable()
export class MemberService {
  private readonly _restRoot: string = environment.restRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  get(projectID: string): Observable<Member[]> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._httpClient.get<Member[]>(url);
  }

  create(projectID: string, member: CreateMember): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users`;
    return this._httpClient.post<Member>(url, member);
  }

  edit(projectID: string, member: Member): Observable<Member> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._httpClient.put<Member>(url, member);
  }

  delete(projectID: string, member: Member): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/users/${member.id}`;
    return this._httpClient.delete(url);
  }
}
