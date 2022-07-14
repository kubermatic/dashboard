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
import {AKSCluster} from '@shared/entity/provider/aks';
import {EKSCluster, EKSVpc} from '@shared/entity/provider/eks';
import {GKECluster, GKEZone} from '@shared/entity/provider/gke';
import {ExternalCluster, ExternalClusterModel, ExternalClusterProvider} from '@shared/entity/external-cluster';
import {PresetList} from '@shared/entity/preset';
import {BehaviorSubject, Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {environment} from '@environments/environment';

@Injectable({providedIn: 'root'})
export class ExternalClusterService {
  providerChanges = new BehaviorSubject<ExternalClusterProvider>(undefined);
  presetChanges = new BehaviorSubject<string>(undefined);
  presetStatusChanges = new BehaviorSubject<boolean>(false);
  private _providerCredentialChanges$ = new BehaviorSubject<boolean>(false);

  private _provider: ExternalClusterProvider;
  private _externalCluster: ExternalClusterModel = ExternalClusterModel.new();
  private _preset: string;
  private _error: string;
  private _isValidating = false;
  private _credentialsStepValidity = false;
  private _clusterStepValidity = false;
  private _isClusterDetailsStepValid = false;
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

  set credentialsStepValidity(valid: boolean) {
    this._credentialsStepValidity = valid;
  }

  set clusterStepValidity(valid: boolean) {
    this._clusterStepValidity = valid;
  }

  get isClusterDetailsStepValid(): boolean {
    return this._isClusterDetailsStepValid;
  }

  set isClusterDetailsStepValid(valid: boolean) {
    this._isClusterDetailsStepValid = valid;
  }

  set isPresetEnabled(isPresetEnabled: boolean) {
    this.presetStatusChanges.next(isPresetEnabled);
  }

  get isCredentialsStepValid(): boolean {
    return this._credentialsStepValidity;
  }

  get isClusterStepValid(): boolean {
    return this._clusterStepValidity;
  }

  set isCredentialsValidated(validated: boolean) {
    this._providerCredentialChanges$.next(validated);
  }

  getProviderCredentialChangesObservable(): Observable<boolean> {
    return this._providerCredentialChanges$.asObservable();
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
    this.isClusterDetailsStepValid = false;
  }

  getGKEZones(): Observable<GKEZone[]> {
    const url = `${this._newRestRoot}//providers/gke/zones`;
    return this._http.get<GKEZone[]>(url, {headers: this._getGKEHeaders()}).pipe(catchError(() => of<[]>()));
  }

  getEKSVpcs(): Observable<EKSVpc[]> {
    const url = `${this._newRestRoot}/providers/eks/vpcs`;
    return this._http.get<EKSVpc[]>(url, {headers: this._getEKSHeaders()}).pipe(catchError(() => of<[]>()));
  }

  getEKSSubnets(vpcId: string): Observable<string[]> {
    const url = `${this._newRestRoot}/providers/eks/subnets`;
    const headers: HttpHeaders = this._getEKSHeaders(vpcId);
    return this._http.get<string[]>(url, {headers}).pipe(catchError(() => of<[]>()));
  }

  getEKSSecurityGroups(vpcId: string): Observable<string[]> {
    const url = `${this._newRestRoot}/providers/eks/securitygroups`;
    const headers: HttpHeaders = this._getEKSHeaders(vpcId);
    return this._http.get<string[]>(url, {headers}).pipe(catchError(() => of<[]>()));
  }

  createExternalCluster(projectID: string, externalClusterModel: ExternalClusterModel): Observable<ExternalCluster> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters`;

    let headers: HttpHeaders;
    switch (this.provider) {
      case ExternalClusterProvider.EKS:
        headers = this._getEKSHeaders();
        break;
      case ExternalClusterProvider.GKE:
        headers = this._getGKEHeaders();
        break;
      default:
        return throwError(() => 'Not implemented');
    }

    return this._http.post<ExternalCluster>(url, externalClusterModel, {headers}).pipe(catchError(() => of<null>()));
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

  private _getEKSHeaders(vpcId?: string): HttpHeaders {
    let headers = {};
    if (this._preset) {
      headers = {Credential: this._preset};
      if (vpcId) {
        headers = {...headers, VpcId: vpcId};
      }
      return new HttpHeaders(headers);
    }

    headers = {
      AccessKeyID: this._externalCluster.cloud.eks.accessKeyID,
      SecretAccessKey: this._externalCluster.cloud.eks.secretAccessKey,
      Region: this._externalCluster.cloud.eks.region,
    };
    if (vpcId) {
      headers['VpcId'] = vpcId;
    }
    return new HttpHeaders(headers);
  }

  private _getGKEHeaders(): HttpHeaders {
    if (this._preset) {
      return new HttpHeaders({Credential: this._preset});
    }

    return new HttpHeaders({ServiceAccount: this._externalCluster.cloud.gke.serviceAccount});
  }
}
