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
import {SSHKey} from '@shared/entity/ssh-key';

@Injectable()
export class SSHKeyService {
  private readonly _restRoot: string = environment.restRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  add(sshKey: SSHKey, projectID: string): Observable<SSHKey> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._httpClient.post<SSHKey>(url, sshKey);
  }

  list(projectID: string): Observable<SSHKey[]> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys`;
    return this._httpClient.get<SSHKey[]>(url);
  }

  delete(sshkeyID: string, projectID: string): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/sshkeys/${sshkeyID}`;
    return this._httpClient.delete<void>(url);
  }
}
