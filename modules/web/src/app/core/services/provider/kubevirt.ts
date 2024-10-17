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
import {
  KubeVirtInstanceTypeList,
  KubeVirtOSImageList,
  KubeVirtPreferenceList,
  KubeVirtStorageClass,
  KubeVirtSubnet,
} from '@shared/entity/provider/kubevirt';
import {Observable} from 'rxjs';

@Injectable()
export class KubeVirtService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getInstanceTypes(projectID: string, clusterID: string): Observable<KubeVirtInstanceTypeList> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/kubevirt/instancetypes`;
    return this._httpClient.get<KubeVirtInstanceTypeList>(url);
  }

  getPreferences(projectID: string, clusterID: string): Observable<KubeVirtPreferenceList> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/kubevirt/preferences`;
    return this._httpClient.get<KubeVirtPreferenceList>(url);
  }

  getStorageClasses(projectID: string, clusterID: string): Observable<KubeVirtStorageClass[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/kubevirt/storageclasses`;
    return this._httpClient.get<KubeVirtStorageClass[]>(url);
  }

  getSubnets(projectID: string, clusterID: string): Observable<KubeVirtSubnet[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/kubevirt/vpcs/`;
    return this._httpClient.get<KubeVirtSubnet[]>(url);
  }

  getOSImages(dc: string): Observable<KubeVirtOSImageList> {
    const url = `${this._newRestRoot}/providers/kubevirt/dc/${dc}/images`;
    return this._httpClient.get<KubeVirtOSImageList>(url);
  }
}
