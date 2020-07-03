// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, of, timer} from 'rxjs';
import {catchError, shareReplay, switchMapTo} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {TaintFormComponent} from '../../../shared/components/taint-form/taint-form.component';
import {Addon} from '../../../shared/entity/addon';
import {CloudSpecPatch, Cluster, ClusterPatch, Finalizer, MasterVersion} from '../../../shared/entity/cluster';
import {Event} from '../../../shared/entity/event';
import {Health} from '../../../shared/entity/health';
import {ClusterMetrics} from '../../../shared/entity/metrics';
import {Node} from '../../../shared/entity/node';
import {SSHKey} from '../../../shared/entity/ssh-key';
import {CreateClusterModel} from '../../../shared/model/CreateClusterModel';

export class ProviderSettingsPatch {
  cloudSpecPatch: CloudSpecPatch;
  isValid: boolean;
}

@Injectable()
export class ClusterService {
  private _providerSettingsPatch = new Subject<ProviderSettingsPatch>();
  private _restRoot: string = environment.restRoot;
  private _headers: HttpHeaders = new HttpHeaders();
  private _clusters$ = new Map<string, Observable<Cluster[]>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);
  private _onClustersUpdate = new Subject<void>();

  providerSettingsPatchChanges$ = this._providerSettingsPatch.asObservable();
  onClusterUpdate = new Subject<void>();

  constructor(private readonly _http: HttpClient, private readonly _appConfig: AppConfigService) {}

  changeProviderSettingsPatch(patch: ProviderSettingsPatch): void {
    this._providerSettingsPatch.next(patch);
  }

  clusters(projectID: string): Observable<Cluster[]> {
    if (!this._clusters$.get(projectID)) {
      const clusters$ = merge(this._onClustersUpdate, this._refreshTimer$)
        .pipe(switchMapTo(this._getClusters(projectID)))
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
      this._clusters$.set(projectID, clusters$);
    }

    return this._clusters$.get(projectID);
  }

  refreshClusters(): void {
    this._onClustersUpdate.next();
    this._clusters$.clear();
  }

  cluster(projectID: string, clusterID: string, datacenter: string): Observable<Cluster> {
    return merge(this.onClusterUpdate, this._refreshTimer$)
      .pipe(switchMapTo(this._getCluster(projectID, clusterID, datacenter)))
      .pipe(shareReplay({refCount: true, bufferSize: 1}));
  }

  create(projectID: string, datacenter: string, createClusterModel: CreateClusterModel): Observable<Cluster> {
    createClusterModel.nodeDeployment.spec.template.labels = LabelFormComponent.filterNullifiedKeys(
      createClusterModel.nodeDeployment.spec.template.labels
    );
    createClusterModel.nodeDeployment.spec.template.taints = TaintFormComponent.filterNullifiedTaints(
      createClusterModel.nodeDeployment.spec.template.taints
    );

    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters`;
    return this._http.post<Cluster>(url, createClusterModel);
  }

  patch(projectID: string, clusterID: string, datacenter: string, patch: ClusterPatch): Observable<Cluster> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}`;
    return this._http.patch<Cluster>(url, patch);
  }

  delete(
    projectID: string,
    clusterID: string,
    datacenter: string,
    finalizers?: {[key in Finalizer]: boolean}
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}`;
    if (finalizers !== undefined) {
      for (const key of Object.keys(finalizers)) {
        this._headers = this._headers.set(key, finalizers[key].toString());
      }
    }

    return this._http.delete(url, {headers: this._headers});
  }

  upgrades(projectID: string, clusterID: string, datacenter: string): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/upgrades`;
    return this._http.get<MasterVersion[]>(url).pipe(
      catchError(() => {
        return of<MasterVersion[]>([]).pipe(catchError(() => of<MasterVersion[]>()));
      })
    );
  }

  metrics(projectID: string, clusterID: string, datacenter: string): Observable<ClusterMetrics> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/metrics`;
    return this._http.get<ClusterMetrics>(url).pipe(catchError(() => of<ClusterMetrics>(undefined)));
  }

  events(projectID: string, clusterID: string, datacenter: string): Observable<Event[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/events`;
    return this._http.get<Event[]>(url).pipe(catchError(() => of<Event[]>()));
  }

  health(projectID: string, clusterID: string, datacenter: string): Observable<Health> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/health`;
    return this._http.get<Health>(url).pipe(catchError(() => of<Health>()));
  }

  upgradeMachineDeployments(
    projectID: string,
    clusterID: string,
    datacenter: string,
    version: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes/upgrades`;
    return this._http.put(url, {version} as MasterVersion);
  }

  nodes(projectID: string, clusterID: string, datacenter: string): Observable<Node[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes?hideInitialConditions=true`;
    return this._http.get<Node[]>(url).pipe(catchError(() => of<Node[]>()));
  }

  deleteNode(projectID: string, clusterID: string, datacenter: string, nodeID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes/${nodeID}`;
    return this._http.delete(url);
  }

  nodeUpgrades(controlPlaneVersion: string, type: string): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/node?control_plane_version=${controlPlaneVersion}&type=${type}`;
    return this._http.get<MasterVersion[]>(url).pipe(
      catchError(() => {
        return of<MasterVersion[]>([]);
      })
    );
  }

  sshKeys(projectID: string, clusterID: string, datacenter: string): Observable<SSHKey[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys`;
    return this._http.get<SSHKey[]>(url).pipe(catchError(() => of<SSHKey[]>()));
  }

  createSSHKey(projectID: string, clusterID: string, datacenter: string, sshKeyID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys/${sshKeyID}`;
    return this._http.put(url, null);
  }

  deleteSSHKey(projectID: string, clusterID: string, datacenter: string, sshKeyID: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys/${sshKeyID}`;
    return this._http.delete(url);
  }

  addons(projectID: string, cluster: string, dc: string): Observable<Addon[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons`;
    return this._http.get<Addon[]>(url);
  }

  createAddon(addon: Addon, projectID: string, cluster: string, dc: string): Observable<Addon> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons`;
    return this._http.post<Addon>(url, addon);
  }

  editAddon(addon: Addon, projectID: string, cluster: string, dc: string): Observable<Addon> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons/${addon.name}`;
    return this._http.patch<Addon>(url, addon);
  }

  deleteAddon(addonID: string, projectID: string, cluster: string, dc: string): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons/${addonID}`;
    return this._http.delete(url);
  }

  private _getClusters(projectID: string): Observable<Cluster[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters`;
    return this._http.get<Cluster[]>(url).pipe(catchError(() => of<Cluster[]>()));
  }

  private _getCluster(projectID: string, clusterID: string, datacenter: string): Observable<Cluster> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}`;
    return this._http.get<Cluster>(url).pipe(catchError(() => of<Cluster>()));
  }
}
