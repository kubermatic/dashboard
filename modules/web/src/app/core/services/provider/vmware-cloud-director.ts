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
import {environment} from '@environments/environment';
import {
  VMwareCloudDirectorCatalog,
  VMwareCloudDirectorStorageProfile,
  VMwareCloudDirectorTemplate,
  VMwareCloudDirectorPlacementPolicy,
} from '@shared/entity/provider/vmware-cloud-director';
import {Observable} from 'rxjs';

@Injectable()
export class VMwareCloudDirectorService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getStorageProfiles(projectID: string, clusterID: string): Observable<VMwareCloudDirectorStorageProfile[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vmwareclouddirector/storageprofiles`;
    return this._httpClient.get<VMwareCloudDirectorStorageProfile[]>(url);
  }

  getCatalogs(projectID: string, clusterID: string): Observable<VMwareCloudDirectorCatalog[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vmwareclouddirector/catalogs`;
    return this._httpClient.get<VMwareCloudDirectorCatalog[]>(url);
  }

  getPlacementPolicies(projectID: string, clusterID: string): Observable<VMwareCloudDirectorPlacementPolicy[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vmwareclouddirector/placementpolicies`;
    return this._httpClient.get<VMwareCloudDirectorPlacementPolicy[]>(url);
  }

  getTemplates(projectID: string, clusterID: string, catalogName: string): Observable<VMwareCloudDirectorTemplate[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/providers/vmwareclouddirector/templates/${catalogName}`;
    return this._httpClient.get<VMwareCloudDirectorTemplate[]>(url);
  }
}
