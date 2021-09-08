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

import {environment} from '@environments/environment';
import {MeteringConfiguration, MeteringCredentials} from '@shared/entity/datacenter';
import {Observable, Subject} from 'rxjs';

@Injectable()
export class MeteringService {
  private _restRoot: string = environment.restRoot;
  readonly onConfigurationChange$ = new Subject<void>();
  readonly onCredentialsChange$ = new Subject<void>();

  constructor(private readonly _http: HttpClient) {}

  saveConfiguration(configuration: MeteringConfiguration): Observable<any> {
    const url = `${this._restRoot}/admin/metering/configurations`;
    return this._http.put(url, configuration);
  }

  saveCredentials(credentials: MeteringCredentials): Observable<any> {
    const url = `${this._restRoot}/admin/metering/credentials`;
    return this._http.put(url, credentials);
  }
}
