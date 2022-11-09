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

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {Observable} from 'rxjs';
import {AlibabaInstanceType, AlibabaVSwitch, AlibabaZone} from '@shared/entity/provider/alibaba';

@Injectable()
export class AlibabaService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getZones(projectID: string, clusterID: string, region: string): Observable<AlibabaZone[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/alibaba/zones`;
    const headers = new HttpHeaders().set('Region', region);
    return this._httpClient.get<AlibabaZone[]>(url, {headers});
  }

  getVSwitches(projectID: string, clusterID: string, region: string): Observable<AlibabaVSwitch[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/alibaba/vswitches`;
    const headers = new HttpHeaders().set('Region', region);
    return this._httpClient.get<AlibabaVSwitch[]>(url, {headers});
  }

  getInstanceTypes(projectID: string, clusterID: string, region: string): Observable<AlibabaInstanceType[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/alibaba/instancetypes`;
    const headers = new HttpHeaders().set('Region', region);
    return this._httpClient.get<AlibabaInstanceType[]>(url, {headers});
  }
}
