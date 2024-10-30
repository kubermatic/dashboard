// Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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
import {VSphereTag} from '@shared/entity/node';
import {VSphereTagCategory, VSphereVMGroup} from '@shared/entity/provider/vsphere';
import {Observable} from 'rxjs';

@Injectable()
export class VSphereService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getTagCategories(projectID: string, clusterID: string): Observable<VSphereTagCategory[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vsphere/tagcategories`;
    return this._httpClient.get<VSphereTagCategory[]>(url);
  }

  getTags(projectID: string, clusterID: string, tagCategory: string): Observable<VSphereTag[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vsphere/tagcategories/${tagCategory}/tags`;
    return this._httpClient.get<VSphereTag[]>(url);
  }

  getVMGroups(projectID: string, clusterID: string): Observable<VSphereVMGroup[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vsphere/vmgroups`;
    return this._httpClient.get<VSphereVMGroup[]>(url);
  }
}
