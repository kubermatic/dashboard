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
    const url = `${this._newRestRoot}/policytemplate`;
    if (projectID) {
      return this._http.get<PolicyTemplate[]>(`${url}?project_id=${projectID}`);
    }
    return this._http.get<PolicyTemplate[]>(url);
  }

  createPolicyTemplate(template: PolicyTemplate): Observable<PolicyTemplate> {
    const url = `${this._newRestRoot}/policytemplate`;
    return this._http.post<PolicyTemplate>(url, template);
  }

  patchPolicyTemplate(template: PolicyTemplate): Observable<PolicyTemplate> {
    const url = `${this._newRestRoot}/policytemplate/${template.name}`;
    return this._http.patch<PolicyTemplate>(url, template);
  }

  deletePolicyTemplate(name: string, projectID?: string): Observable<void> {
    const url = `${this._newRestRoot}/policytemplate/${name}`;
    if (projectID) {
      return this._http.delete<void>(`${url}?project_id=${projectID}`);
    }
    return this._http.delete<void>(url);
  }

  listPolicyBindings(projectID: string): Observable<PolicyBinding[]> {
    const url = `${this._newRestRoot}/policybinding`;
    if (projectID) {
      return this._http.get<PolicyBinding[]>(`${url}?project_id=${projectID}`);
    }
    return this._http.get<PolicyBinding[]>(url);
  }

  createPolicyBinding(binding: PolicyBinding): Observable<PolicyBinding> {
    const url = `${this._newRestRoot}/policybinding`;
    return this._http.post<PolicyBinding>(url, binding);
  }

  patchPolicyBinding(binding: PolicyBinding): Observable<PolicyBinding> {
    const url = `${this._newRestRoot}/policybinding/${binding.name}`;
    return this._http.patch<PolicyBinding>(url, binding);
  }

  deletePolicyBinding(binding: PolicyBinding, projectID?: string): Observable<void> {
    const url = `${this._newRestRoot}/policybinding/${binding.namespace}/${binding.name}`;
    if (projectID) {
      return this._http.delete<void>(`${url}?project_id=${projectID}`);
    }
    return this._http.delete<void>(url);
  }
}
