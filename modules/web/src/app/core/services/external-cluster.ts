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
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {Router} from '@angular/router';
import {MasterVersion} from '@app/shared/entity/cluster';
import {View} from '@app/shared/entity/common';
import {GCPDiskType, GCPMachineSize} from '@app/shared/entity/provider/gcp';
import {KubeOnePresetsService} from '@core/services/kubeone-wizard/kubeone-presets';
import {NotificationService} from '@core/services/notification';
import {environment} from '@environments/environment';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {
  DeleteExternalClusterAction,
  ExternalCluster,
  ExternalClusterModel,
  ExternalClusterProvider,
} from '@shared/entity/external-cluster';
import {PresetList} from '@shared/entity/preset';
import {AKSCluster, AKSLocation, AKSVMSize, AzureResourceGroup} from '@shared/entity/provider/aks';
import {EKSCluster, EKSClusterRole, EKSSecurityGroup, EKSSubnet, EKSVpc} from '@shared/entity/provider/eks';
import {GKECluster, GKEZone} from '@shared/entity/provider/gke';
import _ from 'lodash';
import {BehaviorSubject, Observable, of, Subject} from 'rxjs';
import {catchError, filter} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class ExternalClusterService {
  providerChanges = new BehaviorSubject<ExternalClusterProvider>(undefined);
  private _presetChanges = new BehaviorSubject<string>(null);
  private _regionChanges = new BehaviorSubject<string>(null);
  presetStatusChanges = new Subject<boolean>();

  private _provider: ExternalClusterProvider;
  private _externalCluster: ExternalClusterModel = ExternalClusterModel.new();
  private _preset: string;
  private _region: string;
  private _error: string;
  private _isValidating = false;
  private _credentialsStepValidity = false;
  private _clusterStepValidity = false;
  private _isClusterDetailsStepValid = false;
  private _newRestRoot: string = environment.newRestRoot;

  constructor(
    private readonly _kubeOnePresetsService: KubeOnePresetsService,
    private readonly _http: HttpClient,
    private readonly _matDialog: MatDialog,
    private readonly _notificationService: NotificationService,
    private readonly _router: Router
  ) {}

  get presetChanges(): Observable<string> {
    return this._presetChanges.asObservable().pipe(filter(preset => preset !== null));
  }

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
    this._presetChanges.next(preset);
  }

  get regionChanges(): Observable<string> {
    return this._regionChanges.asObservable().pipe(filter(region => region !== null));
  }

  set region(regionName: string) {
    this._region = regionName;
    this._regionChanges.next(regionName);
  }

  get region(): string {
    return this._region;
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

  import(projectID: string, model: ExternalClusterModel): Observable<ExternalCluster> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters`;
    const headers = this._preset ? new HttpHeaders({Credential: this._preset}) : undefined;
    return this._http.post<ExternalCluster>(url, model, {headers: headers});
  }

  getPresets(projectID: string, provider: ExternalClusterProvider): Observable<PresetList> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/${provider}/presets?disabled=false`;
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
    projectID: string,
    tenantID: string,
    subscriptionID: string,
    clientID: string,
    clientSecret: string
  ): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/validatecredentials`;
    const headers = new HttpHeaders({
      TenantID: tenantID,
      SubscriptionID: subscriptionID,
      ClientID: clientID,
      ClientSecret: clientSecret,
    });
    return this._http.get(url, {headers: headers});
  }

  validateGKECredentials(projectID: string, serviceAccount: string): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/validatecredentials`;
    const headers = new HttpHeaders({ServiceAccount: serviceAccount});
    return this._http.get(url, {headers: headers});
  }

  validateEKSCredentials(
    projectID: string,
    accessKeyID: string,
    secretAccessKey: string,
    assumeRoleARN: string,
    assumeRoleExternalID: string,
    region: string
  ): Observable<any> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/validatecredentials`;
    const headers = new HttpHeaders({
      AccessKeyID: accessKeyID,
      SecretAccessKey: secretAccessKey,
      Region: region,
      AssumeRoleARN: assumeRoleARN,
      AssumeRoleExternalID: assumeRoleExternalID,
    });
    return this._http.get(url, {headers: headers});
  }

  reset(): void {
    this.provider = undefined;
    this.preset = undefined;
    this.region = undefined;
    this.isPresetEnabled = false;
    this.externalCluster = ExternalClusterModel.new();
    this.error = undefined;
    this.isValidating = false;
    this.credentialsStepValidity = false;
    this.clusterStepValidity = false;
    this.isClusterDetailsStepValid = false;
  }

  getAKSResourceGroups(projectID: string): Observable<AzureResourceGroup[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/resourcegroups`;
    return this._http.get<AzureResourceGroup[]>(url, {headers: this._getAKSHeaders()}).pipe(catchError(() => of([])));
  }

  getAKSVmSizes(projectID: string, location: string): Observable<AKSVMSize[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/vmsizes`;
    return this._http.get<AKSVMSize[]>(url, {headers: this._getAKSHeaders(location)}).pipe(catchError(() => of([])));
  }

  getAKSKubernetesVersions(projectID: string): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/versions`;
    return this._http.get<MasterVersion[]>(url).pipe(catchError(() => of<[]>()));
  }

  getAKSLocations(projectID: string): Observable<AKSLocation[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/aks/locations`;
    return this._http.get<AKSLocation[]>(url, {headers: this._getAKSHeaders()}).pipe(catchError(() => of([])));
  }

  getGKEZones(projectID: string): Observable<GKEZone[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/zones`;
    return this._http.get<GKEZone[]>(url, {headers: this._getGKEHeaders()}).pipe(catchError(() => of<[]>()));
  }

  getGKEKubernetesVersions(
    projectID: string,
    zone: string,
    mode: string,
    releaseChannel?: string
  ): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/versions`;
    let headers: {};
    if (releaseChannel) {
      headers = {headers: this._getGKEHeaders(zone, mode, releaseChannel)};
    } else {
      headers = {headers: this._getGKEHeaders(zone, mode)};
    }
    return this._http.get<MasterVersion[]>(url, headers).pipe(catchError(() => of([])));
  }

  getGKEDiskTypes(projectID: string, zone: string): Observable<GCPDiskType[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/disktypes`;
    return this._http.get<GCPDiskType[]>(url, {headers: this._getGKEHeaders(zone)}).pipe(catchError(() => of([])));
  }

  getGKEMachineTypes(projectID: string, zone: string): Observable<GCPMachineSize[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/gke/vmsizes`;
    return this._http.get<GCPMachineSize[]>(url, {headers: this._getGKEHeaders(zone)}).pipe(catchError(() => of([])));
  }

  getEKSVpcs(projectID: string): Observable<EKSVpc[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/vpcs`;
    return this._http.get<EKSVpc[]>(url, {headers: this._getEKSHeaders()}).pipe(catchError(() => of([])));
  }

  getEKSSubnets(projectID: string, vpcId: string): Observable<EKSSubnet[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/subnets`;
    const headers: HttpHeaders = this._getEKSHeaders(vpcId);
    return this._http.get<EKSSubnet[]>(url, {headers}).pipe(catchError(() => of([])));
  }

  getEKSSecurityGroups(projectID: string, vpcId: string): Observable<EKSSecurityGroup[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/securitygroups`;
    const headers: HttpHeaders = this._getEKSHeaders(vpcId);
    return this._http.get<EKSSecurityGroup[]>(url, {headers}).pipe(catchError(() => of([])));
  }

  getEKSKubernetesVersions(projectID: string): Observable<MasterVersion[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/versions`;
    return this._http.get<MasterVersion[]>(url).pipe(catchError(() => of<[]>()));
  }

  getEKSClusterRoles(projectID: string): Observable<EKSClusterRole[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/clusterroles`;
    const headers = this._getEKSHeaders();
    return this._http.get<EKSClusterRole[]>(url, {headers}).pipe(catchError(() => of([])));
  }

  getEKSRegions(
    projectID: string,
    preset?: string,
    accessKeyID?: string,
    secretAccessKey?: string
  ): Observable<string[]> {
    const url = `${this._newRestRoot}/projects/${projectID}/providers/eks/regions`;
    let credentials = {};
    if (preset) {
      credentials = {
        Credential: preset,
      };
    } else {
      credentials = {
        AccessKeyID: accessKeyID,
        SecretAccessKey: secretAccessKey,
      };
    }
    const headers = new HttpHeaders(credentials);
    return this._http.get<string[]>(url, {headers}).pipe(catchError(() => of([])));
  }

  createExternalCluster(projectID: string, externalClusterModel: ExternalClusterModel): Observable<ExternalCluster> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters`;

    let headers: HttpHeaders;
    switch (this.provider) {
      case ExternalClusterProvider.AKS:
        headers = this._getAKSHeaders();
        break;
      case ExternalClusterProvider.EKS:
        headers = this._getEKSHeaders();
        break;
      case ExternalClusterProvider.GKE:
        headers = this._getGKEHeaders();
        break;
      default:
        if (ExternalCluster.getProvider(externalClusterModel.cloud) === ExternalClusterProvider.KubeOne) {
          headers = this._getKubeOneHeaders();
        }
        break;
    }
    return this._http.post<ExternalCluster>(url, externalClusterModel, {headers});
  }

  showDisconnectClusterDialog(cluster: ExternalCluster, projectID: string): void {
    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'Disconnect Cluster',
        message: `Are you sure you want to disconnect <b>${_.escape(
          cluster.name
        )}</b> cluster? This action will not remove the cluster from the cloud provider’s end.`,
        confirmLabel: 'Disconnect',
        throttleButton: true,
        observable: this.deleteExternalCluster(projectID, cluster.id, DeleteExternalClusterAction.Disconnect),
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .subscribe(_ => {
        const view =
          ExternalCluster.getProvider(cluster.cloud) === ExternalClusterProvider.KubeOne
            ? View.KubeOneClusters
            : View.ExternalClusters;
        this._router.navigate([`/projects/${projectID}/${view}`]);
        this._notificationService.success(`Disconnected the ${cluster.name} cluster`);
      });
  }

  deleteExternalCluster(projectID: string, clusterID: string, action: DeleteExternalClusterAction): Observable<void> {
    const url = `${this._newRestRoot}/projects/${projectID}/kubernetes/clusters/${clusterID}`;
    const headers = new HttpHeaders({
      Action: action,
    });
    return this._http.delete<void>(url, {headers: headers});
  }

  private _getAKSHeaders(location?: string): HttpHeaders {
    let headers = {};
    if (this._preset) {
      headers = {Credential: this._preset};
      if (location) {
        headers = {Credential: this._preset, Location: location};
        return new HttpHeaders(headers);
      }
      return new HttpHeaders(headers);
    }

    headers = {
      TenantID: this._externalCluster.cloud.aks.tenantID,
      SubscriptionID: this._externalCluster.cloud.aks.subscriptionID,
      ClientID: this._externalCluster.cloud.aks.clientID,
      ClientSecret: this._externalCluster.cloud.aks.clientSecret,
    };

    if (location) {
      headers['Location'] = location;
    }

    return new HttpHeaders(headers);
  }

  private _getEKSHeaders(vpcId?: string): HttpHeaders {
    let headers = {};
    if (this._preset) {
      headers = {
        Credential: this._preset,
        Region: this._externalCluster.cloud?.eks.region,
      };
      if (vpcId) {
        headers = {...headers, VpcId: vpcId};
      }
      return new HttpHeaders(headers);
    }

    headers = {
      AccessKeyID: this._externalCluster.cloud.eks.accessKeyID,
      SecretAccessKey: this._externalCluster.cloud.eks.secretAccessKey,
      Region: this._externalCluster.cloud?.eks.region,
    };
    if (vpcId) {
      headers['VpcId'] = vpcId;
    }
    return new HttpHeaders(headers);
  }

  private _getGKEHeaders(zone?: string, mode?: string, releaseChannel?: string): HttpHeaders {
    let headers = {};

    if (this._preset) {
      headers = {Credential: this._preset};
    } else {
      headers = {ServiceAccount: this._externalCluster.cloud?.gke?.serviceAccount};
    }

    if (zone) {
      headers = {...headers, Zone: zone};
    }
    if (mode) {
      headers = {...headers, Mode: mode};
    }
    if (releaseChannel) {
      headers = {...headers, ReleaseChannel: releaseChannel};
    }
    return new HttpHeaders(headers);
  }

  private _getKubeOneHeaders(): HttpHeaders {
    let headers = {};

    if (this._kubeOnePresetsService.preset) {
      headers = {Credential: this._kubeOnePresetsService.preset};
    }

    return new HttpHeaders(headers);
  }
}
