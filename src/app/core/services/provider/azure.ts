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
import {AzureSizes, AzureZones} from '@shared/entity/provider/azure';

@Injectable()
export class AzureService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getSizes(projectID: string, clusterID: string): Observable<AzureSizes[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/azure/sizes`;
    return this._httpClient.get<AzureSizes[]>(url);
  }

  getAvailabilityZones(projectID: string, clusterID: string, size: string): Observable<AzureZones> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/azure/availabilityzones`;
    const headers = new HttpHeaders().set('SKUName', size);
    return this._httpClient.get<AzureZones>(url, {headers});
  }
}
