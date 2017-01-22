import { Injectable } from "@angular/core";
import {Http, Headers, Response} from "@angular/http";
import "rxjs/add/operator/map";
import {Observable} from "rxjs";
import { environment } from "../../environments/environment";

import {CreateNodeModel} from "./model/CreateNodeModel";
import {ClusterModel} from "./model/ClusterModel";
import {DataCenterEntity} from "./entitiy/DatacenterEntity";
import {ClusterEntity} from "./entitiy/ClusterEntity";
import {NodeEntity} from "./entitiy/NodeEntity";
import {Auth} from "../auth/auth.service";
import {SSHKeyEntity} from "./entitiy/SSHKeyEntity";

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: Headers = new Headers();

  constructor(private _http: Http, private _auth: Auth) {
    this.headers.append("Authorization", "Bearer " + Auth.getBearerToken());
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getDataCenter(dc: string): Observable<DataCenterEntity> {
    const url = `${this.restRoot}/dc/${dc}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusters(dc: string): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getCluster(clusterModel: ClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  createCluster(dc: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${dc}/cluster`;

    return this._http.post(url, "", { headers: this.headers })
      .map(res => res.json());
  }

  setCloudProvider(clusterModel: ClusterModel, node_dc: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/cloud`;

    return this._http.put(url, {dc: node_dc}, { headers: this.headers })
      .map(res => res.json());
  }

  getKubeconfig(clusterModel: ClusterModel, authorization_token: string): Observable<string> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/kubeconfig?token=${authorization_token}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  deleteCluster(clusterModel: ClusterModel) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.delete(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusterNodes(clusterModel: ClusterModel): Observable<NodeEntity[]> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusterNode(clusterModel: ClusterModel, node_name: string): Observable<NodeEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  createClusterNode(clusterModel: ClusterModel, nodeModel: CreateNodeModel): Observable<NodeEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;

    return this._http.post(url, nodeModel, { headers: this.headers })
      .map(res => res.json());
  }

  deleteClusterNode(clusterModel: ClusterModel, node_name: string) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;

    return this._http.delete(url, { headers: this.headers })
      .map(res => res.json());
  }

  getKubernetesNode(clusterModel: ClusterModel, node_name: string) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/k8s/nodes/${node_name}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/sshkeys`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  deleteSSHKey(keyName: string): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/sshkeys/${keyName}`;

    return this._http.delete(url, { headers: this.headers })
      .map(res => res.json());
  }

  addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/sshkeys`;

    return this._http.post(url, sshKey, { headers: this.headers })
      .map(res => res.json());
  }
}
