// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {catchError, Observable, of} from 'rxjs';
import {environment} from '@environments/environment';
import {OperatingSystemProfile} from '@shared/entity/operating-system-profile';

@Injectable()
export class OperatingSystemManagerService {
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  getOperatingSystemProfilesForCluster(clusterID: string, projectID: string): Observable<OperatingSystemProfile[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/operatingsystemprofiles`;
    return this._http.get<OperatingSystemProfile[]>(url).pipe(catchError(() => of<OperatingSystemProfile[]>([])));
  }

  getOperatingSystemProfilesForSeed(seed: string): Observable<OperatingSystemProfile[]> {
    const url = `${this._newRestRoot}/seeds/${seed}/operatingsystemprofiles`;
    return this._http.get<OperatingSystemProfile[]>(url).pipe(catchError(() => of<OperatingSystemProfile[]>([])));
  }
}
