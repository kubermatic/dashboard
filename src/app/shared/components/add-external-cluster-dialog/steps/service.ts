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
import {ExternalCluster, ExternalClusterModel, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {PresetList} from '@shared/entity/preset';
import {AKSCluster} from '@app/shared/entity/provider/aks';
import {EKSCluster} from '@app/shared/entity/provider/eks';
import {GKECluster} from '@app/shared/entity/provider/gke';

@Injectable({providedIn: 'root'})
export class ExternalClusterService {
  providerChanges = new BehaviorSubject<ExternalClusterProvider>(undefined);
  presetChanges = new BehaviorSubject<string>(undefined);
  presetStatusChanges = new BehaviorSubject<boolean>(false);

  private _provider: ExternalClusterProvider;
  private _externalCluster: ExternalClusterModel = ExternalClusterModel.new();
  private _preset: string;
  private _error: string;
  private _isValidating = false;
  private _credentialsStepValidity = false;
  private _clusterStepValidity = false;
  private _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  get provider(): ExternalClusterProvider {
    return this._provider;
  }

  set provider(provider: ExternalClusterProvider) {
    this._provider = provider;
    this.providerChanges.next(this._provider);
  }

  get externalCluster(): ExternalClusterModel {
    return this._externalCluster;
  }

  set externalCluster(externalCluster: ExternalClusterModel) {
    this._externalCluster = externalCluster;
  }

  get preset(): string {
    return this._preset;
  }

  set preset(preset: string) {
    this._preset = preset;
    this.presetChanges.next(preset);
  }

  set isPresetEnabled(isPresetEnabled: boolean) {
    this.presetStatusChanges.next(isPresetEnabled);
  }

  get error(): string {
    return this._error;
  }

  set error(error: string) {
    this._error = error;
  }

  get isValidating(): boolean {
    return this._isValidating;
  }

  set isValidating(isValidating: boolean) {
    this._isValidating = isValidating;
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

  import(projectID: string, model: ExternalClusterModel): Observable<ExternalCluster> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters`;
    const headers = this._preset ? new HttpHeaders({Credential: this._preset}) : undefined;
    return this._http.post<ExternalCluster>(url, model, {headers: headers});
  }

  getPresets(provider: ExternalClusterProvider): Observable<PresetList> {
    const url = `${this._newRestRoot}/providers/${provider}/presets?disabled=false`;
    return this._http.get<PresetList>(url);
  }

  validateAKSCredentials(
    tenantID: string,
    subscriptionID: string,
    clientID: string,
    clientSecret: string
  ): Observable<any> {
    const url = `${this._newRestRoot}/providers/aks/validatecredentials`;
    const headers = new HttpHeaders({
      TenantID: tenantID,
      SubscriptionID: subscriptionID,
      ClientID: clientID,
      ClientSecret: clientSecret,
    });
    return this._http.get(url, {headers: headers});
  }

  getAKSClusters(projectID: string): Observable<AKSCluster[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/clusters`;
    return this._http
      .get<AKSCluster[]>(url, {headers: this._getAKSHeaders()})
      .pipe(catchError(() => of<AKSCluster[]>()));
  }

  getEKSClusters(projectID: string): Observable<EKSCluster[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/clusters`;
    return this._http
      .get<EKSCluster[]>(url, {headers: this._getEKSHeaders()})
      .pipe(catchError(() => of<EKSCluster[]>()));
  }

  getGKEClusters(projectID: string): Observable<GKECluster[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/clusters`;
    return this._http
      .get<GKECluster[]>(url, {headers: this._getGKEHeaders()})
      .pipe(catchError(() => of<GKECluster[]>()));
  }

  validateGKECredentials(serviceAccount: string): Observable<any> {
    const url = `${this._newRestRoot}/providers/gke/validatecredentials`;
    const headers = new HttpHeaders({ServiceAccount: serviceAccount});
    return this._http.get(url, {headers: headers});
  }

  validateEKSCredentials(accessKeyID: string, secretAccessKey: string, region: string): Observable<any> {
    const url = `${this._newRestRoot}/providers/eks/validatecredentials`;
    const headers = new HttpHeaders({
      AccessKeyID: accessKeyID,
      SecretAccessKey: secretAccessKey,
      Region: region,
    });
    return this._http.get(url, {headers: headers});
  }

  reset(): void {
    this.provider = undefined;
    this.preset = undefined;
    this.isPresetEnabled = false;
    this.externalCluster = ExternalClusterModel.new();
    this.error = undefined;
    this.isValidating = false;
    this.credentialsStepValidity = false;
    this.clusterStepValidity = false;
  }

  private _getAKSHeaders(): HttpHeaders {
    if (this._preset) {
      return new HttpHeaders({Credential: this._preset});
    }

    return new HttpHeaders({
      TenantID: this._externalCluster.cloud.aks.tenantID,
      SubscriptionID: this._externalCluster.cloud.aks.subscriptionID,
      ClientID: this._externalCluster.cloud.aks.clientID,
      ClientSecret: this._externalCluster.cloud.aks.clientSecret,
    });
  }

  private _getEKSHeaders(): HttpHeaders {
    if (this._preset) {
      return new HttpHeaders({Credential: this._preset});
    }

    return new HttpHeaders({
      AccessKeyID: this._externalCluster.cloud.eks.accessKeyID,
      SecretAccessKey: this._externalCluster.cloud.eks.secretAccessKey,
      Region: this._externalCluster.cloud.eks.region,
    });
  }

  private _getGKEHeaders(): HttpHeaders {
    if (this._preset) {
      return new HttpHeaders({Credential: this._preset});
    }

    return new HttpHeaders({ServiceAccount: this._externalCluster.cloud.gke.serviceAccount});
  }
}
