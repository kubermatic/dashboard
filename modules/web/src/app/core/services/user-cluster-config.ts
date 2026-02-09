// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {GlobalAdmissionPluginsConfiguration} from '@shared/entity/cluster';

@Injectable({
  providedIn: 'root',
})
export class UserClusterConfigService {
  private readonly _newRestRoot = environment.newRestRoot;
  private readonly _admissionPluginsUrl = `${this._newRestRoot}/userclusterconfig/admissionplugins`;

  constructor(private readonly _httpClient: HttpClient) {}

  getAdmissionPluginsConfiguration(): Observable<GlobalAdmissionPluginsConfiguration> {
    return this._httpClient
      .get<GlobalAdmissionPluginsConfiguration>(this._admissionPluginsUrl)
      .pipe(catchError(() => of({} as GlobalAdmissionPluginsConfiguration)));
  }

  patchAdmissionPluginsConfiguration(
    config: GlobalAdmissionPluginsConfiguration
  ): Observable<GlobalAdmissionPluginsConfiguration> {
    return this._httpClient.patch<GlobalAdmissionPluginsConfiguration>(this._admissionPluginsUrl, config);
  }
}
