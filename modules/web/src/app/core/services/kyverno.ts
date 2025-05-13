// Copyright 2025 The Kubermatic Kubernetes Platform contributors.
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
import {PolicyBinding, PolicyTemplate} from '@app/shared/entity/kyverno';
import {environment} from '@environments/environment';
import {Observable} from 'rxjs';

@Injectable()
export class KyvernoService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  listPolicyTemplates(projectID?: string): Observable<PolicyTemplate[]> {
    const url = `${this._newRestRoot}/policytemplates`;
    if (projectID) {
      return this._http.get<PolicyTemplate[]>(`${url}?project_id=${projectID}`);
    }
    return this._http.get<PolicyTemplate[]>(url);
  }

  createPolicyTemplate(template: PolicyTemplate): Observable<PolicyTemplate> {
    const url = `${this._newRestRoot}/policytemplates`;
    return this._http.post<PolicyTemplate>(url, template);
  }

  patchPolicyTemplate(template: PolicyTemplate): Observable<PolicyTemplate> {
    const url = `${this._newRestRoot}/policytemplates/${template.name}`;
    return this._http.patch<PolicyTemplate>(url, template);
  }

  deletePolicyTemplate(name: string, projectID?: string): Observable<void> {
    const url = `${this._newRestRoot}/policytemplates/${name}`;
    if (projectID) {
      return this._http.delete<void>(`${url}?project_id=${projectID}`);
    }
    return this._http.delete<void>(url);
  }

  listPolicyBindings(projectID: string, clusterID: string): Observable<PolicyBinding[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/policybindings`;

    return this._http.get<PolicyBinding[]>(url);
  }

  createPolicyBinding(binding: PolicyBinding, projectID: string, clusterID: string): Observable<PolicyBinding> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/policybindings`;
    return this._http.post<PolicyBinding>(url, binding);
  }

  deletePolicyBinding(bindingName: string, projectID: string, clusterID: string): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/clusters/${clusterID}/policybindings/${bindingName}`;
    if (projectID) {
      return this._http.delete<void>(`${url}?project_id=${projectID}`);
    }
    return this._http.delete<void>(url);
  }
}
