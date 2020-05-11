import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {merge, Observable, of, timer} from 'rxjs';
import {catchError, shareReplay, switchMapTo} from 'rxjs/operators';
import {Subject} from 'rxjs/Subject';

import {environment} from '../../../../environments/environment';
import {AppConfigService} from '../../../app-config.service';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {TaintFormComponent} from '../../../shared/components/taint-form/taint-form.component';
import {AddonEntity} from '../../../shared/entity/AddonEntity';
import {
  ClusterEntity,
  Finalizer,
  MasterVersion,
} from '../../../shared/entity/ClusterEntity';
import {
  CloudSpecPatch,
  ClusterEntityPatch,
} from '../../../shared/entity/ClusterEntityPatch';
import {EventEntity} from '../../../shared/entity/EventEntity';
import {HealthEntity} from '../../../shared/entity/HealthEntity';
import {ClusterMetrics} from '../../../shared/entity/Metrics';
import {NodeEntity} from '../../../shared/entity/NodeEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
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
  private _clusters$ = new Map<string, Observable<ClusterEntity[]>>();
  private _refreshTimer$ = timer(0, this._appConfig.getRefreshTimeBase() * 10);
  private _onClustersUpdate = new Subject<void>();

  providerSettingsPatchChanges$ = this._providerSettingsPatch.asObservable();
  onClusterUpdate = new Subject<void>();

  constructor(
    private readonly _http: HttpClient,
    private readonly _appConfig: AppConfigService
  ) {}

  changeProviderSettingsPatch(patch: ProviderSettingsPatch): void {
    this._providerSettingsPatch.next(patch);
  }

  clusters(projectID: string): Observable<ClusterEntity[]> {
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

  cluster(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<ClusterEntity> {
    return merge(this.onClusterUpdate, this._refreshTimer$)
      .pipe(switchMapTo(this._getCluster(projectID, clusterID, datacenter)))
      .pipe(shareReplay({refCount: true, bufferSize: 1}));
  }

  create(
    projectID: string,
    datacenter: string,
    createClusterModel: CreateClusterModel
  ): Observable<ClusterEntity> {
    createClusterModel.nodeDeployment.spec.template.labels = LabelFormComponent.filterNullifiedKeys(
      createClusterModel.nodeDeployment.spec.template.labels
    );
    createClusterModel.nodeDeployment.spec.template.taints = TaintFormComponent.filterNullifiedTaints(
      createClusterModel.nodeDeployment.spec.template.taints
    );

    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters`;
    return this._http.post<ClusterEntity>(url, createClusterModel);
  }

  patch(
    projectID: string,
    clusterID: string,
    datacenter: string,
    patch: ClusterEntityPatch
  ): Observable<ClusterEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}`;
    return this._http.patch<ClusterEntity>(url, patch);
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

  upgrades(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/upgrades`;
    return this._http.get<MasterVersion[]>(url).pipe(
      catchError(() => {
        return of<MasterVersion[]>([]).pipe(
          catchError(() => of<MasterVersion[]>())
        );
      })
    );
  }

  metrics(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<ClusterMetrics> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/metrics`;
    return this._http
      .get<ClusterMetrics>(url)
      .pipe(catchError(() => of<ClusterMetrics>(undefined)));
  }

  events(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<EventEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/events`;
    return this._http
      .get<EventEntity[]>(url)
      .pipe(catchError(() => of<EventEntity[]>()));
  }

  health(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<HealthEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/health`;
    return this._http
      .get<HealthEntity>(url)
      .pipe(catchError(() => of<HealthEntity>()));
  }

  upgradeNodeDeployments(
    projectID: string,
    clusterID: string,
    datacenter: string,
    version: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes/upgrades`;
    return this._http.put(url, {version} as MasterVersion);
  }

  nodes(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<NodeEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes?hideInitialConditions=true`;
    return this._http
      .get<NodeEntity[]>(url)
      .pipe(catchError(() => of<NodeEntity[]>()));
  }

  deleteNode(
    projectID: string,
    clusterID: string,
    datacenter: string,
    nodeID: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/nodes/${nodeID}`;
    return this._http.delete(url);
  }

  nodeUpgrades(
    controlPlaneVersion: string,
    type: string
  ): Observable<MasterVersion[]> {
    const url = `${this._restRoot}/upgrades/node?control_plane_version=${controlPlaneVersion}&type=${type}`;
    return this._http.get<MasterVersion[]>(url).pipe(
      catchError(() => {
        return of<MasterVersion[]>([]);
      })
    );
  }

  sshKeys(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<SSHKeyEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys`;
    return this._http
      .get<SSHKeyEntity[]>(url)
      .pipe(catchError(() => of<SSHKeyEntity[]>()));
  }

  createSSHKey(
    projectID: string,
    clusterID: string,
    datacenter: string,
    sshKeyID: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys/${sshKeyID}`;
    return this._http.put(url, null);
  }

  deleteSSHKey(
    projectID: string,
    clusterID: string,
    datacenter: string,
    sshKeyID: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}/sshkeys/${sshKeyID}`;
    return this._http.delete(url);
  }

  addons(
    projectID: string,
    cluster: string,
    dc: string
  ): Observable<AddonEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons`;
    return this._http.get<AddonEntity[]>(url);
  }

  createAddon(
    addon: AddonEntity,
    projectID: string,
    cluster: string,
    dc: string
  ): Observable<AddonEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons`;
    return this._http.post<AddonEntity>(url, addon);
  }

  editAddon(
    addon: AddonEntity,
    projectID: string,
    cluster: string,
    dc: string
  ): Observable<AddonEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons/${addon.name}`;
    return this._http.patch<AddonEntity>(url, addon);
  }

  deleteAddon(
    addonID: string,
    projectID: string,
    cluster: string,
    dc: string
  ): Observable<any> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/addons/${addonID}`;
    return this._http.delete(url);
  }

  private _getClusters(projectID: string): Observable<ClusterEntity[]> {
    const url = `${this._restRoot}/projects/${projectID}/clusters`;
    return this._http
      .get<ClusterEntity[]>(url)
      .pipe(catchError(() => of<ClusterEntity[]>()));
  }

  private _getCluster(
    projectID: string,
    clusterID: string,
    datacenter: string
  ): Observable<ClusterEntity> {
    const url = `${this._restRoot}/projects/${projectID}/dc/${datacenter}/clusters/${clusterID}`;
    return this._http
      .get<ClusterEntity>(url)
      .pipe(catchError(() => of<ClusterEntity>()));
  }
}
