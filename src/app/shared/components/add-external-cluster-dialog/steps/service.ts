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

import {Injectable} from '@angular/core';
import {ExternalCluster, ExternalClusterProvider, GKECluster} from '@shared/entity/external-cluster';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class ExternalClusterService {
  providerChanges = new BehaviorSubject<ExternalClusterProvider>(undefined);
  private _provider: ExternalClusterProvider;
  private _externalCluster: ExternalCluster = ExternalCluster.new();
  private _credentialsStepValidity = false;
  private _clusterStepValidity = false;
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  getGKEClusters(projectID: string): Observable<GKECluster[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/clusters`;
    const headers = new HttpHeaders({ServiceAccount: this._externalCluster.cloud.gke.serviceAccount});
    return this._http.get<GKECluster[]>(url, {headers: headers}).pipe(catchError(() => of<GKECluster[]>()));
  }

  get provider(): ExternalClusterProvider {
    return this._provider;
  }

  set provider(provider: ExternalClusterProvider) {
    this._provider = provider;
    this.providerChanges.next(this._provider);
  }

  get externalCluster(): ExternalCluster {
    return this._externalCluster;
  }

  set externalCluster(externalCluster: ExternalCluster) {
    this._externalCluster = externalCluster;
  }

  get isCredentialsStepValid(): boolean {
    return this._credentialsStepValidity;
  }

  set credentialsStepValidity(valid: boolean) {
    this._credentialsStepValidity = valid;
  }

  get isClusterStepValid(): boolean {
    return this._clusterStepValidity;
  }

  set clusterStepValidity(valid: boolean) {
    this._clusterStepValidity = valid;
  }

  reset(): void {
    this.provider = undefined;
    this.externalCluster = ExternalCluster.new();
    this.credentialsStepValidity = false;
    this.clusterStepValidity = false;
  }
}
