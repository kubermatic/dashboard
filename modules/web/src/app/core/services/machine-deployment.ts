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

import { HttpClient } from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AnnotationFormComponent} from '@app/shared/components/annotation-form/component';
import {environment} from '@environments/environment';
import {LabelFormComponent} from '@shared/components/label-form/component';
import {TaintFormComponent} from '@shared/components/taint-form/component';
import {Event} from '@shared/entity/event';
import {MachineDeployment, MachineDeploymentPatch} from '@shared/entity/machine-deployment';
import {NodeMetrics} from '@shared/entity/metrics';
import {Node} from '@shared/entity/node';
import {Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable()
export class MachineDeploymentService {
  private readonly _restRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  create(md: MachineDeployment, clusterID: string, projectID: string): Observable<MachineDeployment> {
    md.spec.template.labels = LabelFormComponent.filterNullifiedKeys(md.spec.template.labels);
    md.spec.template.annotations = AnnotationFormComponent.filterNullifiedKeys(md.spec.template.annotations);
    md.spec.template.taints = TaintFormComponent.filterNullifiedTaints(md.spec.template.taints);

    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterID}/machinedeployments`;
    return this._httpClient.post<MachineDeployment>(url, md);
  }

  list(cluster: string, projectID: string): Observable<MachineDeployment[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments`;
    return this._httpClient.get<MachineDeployment[]>(url).pipe(catchError(() => of<MachineDeployment[]>([])));
  }

  get(mdId: string, cluster: string, projectID: string): Observable<MachineDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}`;
    return this._httpClient.get<MachineDeployment>(url);
  }

  patch(
    patch: MachineDeploymentPatch,
    mdID: string,
    clusterId: string,
    projectID: string
  ): Observable<MachineDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${clusterId}/machinedeployments/${mdID}`;
    return this._httpClient.patch<MachineDeployment>(url, patch);
  }

  restart(cluster: string, md: MachineDeployment, projectID: string): Observable<MachineDeployment> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${md.id}/restart`;
    return this._httpClient.post<MachineDeployment>(url, {});
  }

  delete(cluster: string, md: MachineDeployment, projectID: string): Observable<void> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${md.id}`;
    return this._httpClient.delete<void>(url);
  }

  getNodes(mdId: string, cluster: string, projectID: string): Observable<Node[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes`;
    return this._httpClient.get<Node[]>(url);
  }

  getNodesMetrics(mdId: string, cluster: string, projectID: string): Observable<NodeMetrics[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes/metrics`;
    return this._httpClient.get<NodeMetrics[]>(url);
  }

  getNodesEvents(mdId: string, cluster: string, projectID: string): Observable<Event[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/nodes/events`;
    return this._httpClient.get<Event[]>(url);
  }

  getJoiningScript(mdId: string, cluster: string, projectID: string): Observable<string> {
    const url = `${this._restRoot}/projects/${projectID}/clusters/${cluster}/machinedeployments/${mdId}/joiningscript`;
    return this._httpClient.get<string>(url);
  }
}
