import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import "rxjs/add/operator/map";
import {Observable} from "rxjs";
import { environment } from "../../environments/environment";

import {CreateNodeModel} from "./model/CreateNodeModel";
import {ClusterModel} from "./model/ClusterModel";
import {DataCenterEntity} from "./entitiy/DatacenterEntity";
import {ClusterEntity} from "./entitiy/ClusterEntity";
import {NodeEntity} from "./entitiy/NodeEntity";

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;

  constructor(private _http: Http) {
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    let url = `${this.restRoot}`;

    return this._http.get(url)
      .map(res => res.json());
  }

  getDataCenter(dc: string): Observable<DataCenterEntity> {
    let url = `${this.restRoot}${dc}`;

    return this._http.get(url)
      .map(res => res.json());
  }

  getClusters(dc: string): Observable<ClusterEntity[]> {
    let url = `${this.restRoot}${dc}/cluster`;

    return this._http.get(url)
      .map(res => res.json());
  }

  getCluster(clusterModel: ClusterModel): Observable<ClusterEntity> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.get(url)
      .map(res => res.json());
  }

  createCluster(dc: string): Observable<ClusterEntity> {
    let url = `${this.restRoot}${dc}/cluster`;

    return this._http.post(url, '')
      .map(res => res.json());
  }

  setCloudProvider(clusterModel: ClusterModel, node_dc: string): Observable<ClusterEntity> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/cloud`;

    return this._http.put(url, {dc: node_dc})
      .map(res => res.json());
  }

  getKubeconfig(clusterModel: ClusterModel, authorization_token: string): Observable<string> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/kubeconfig?token=${authorization_token}`;

    return this._http.get(url)
      .map(res => res.json());
  }

  deleteCluster(clusterModel: ClusterModel) {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.delete(url)
      .map(res => res.json());
  }

  getClusterNodes(clusterModel: ClusterModel): Observable<NodeEntity[]> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;

    return this._http.get(url)
      .map(res => res.json());
  }

  getClusterNode(clusterModel: ClusterModel, node_name: string): Observable<NodeEntity> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;

    return this._http.get(url)
      .map(res => res.json());
  }

  createClusterNode(clusterModel: ClusterModel, nodeModel: CreateNodeModel): Observable<NodeEntity> {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;

    return this._http.post(url, nodeModel)
      .map(res => res.json());
  }

  deleteClusterNode(clusterModel: ClusterModel, node_name: string) {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;

    return this._http.delete(url)
      .map(res => res.json());
  }

  getKubernetesNode(clusterModel: ClusterModel, node_name: string) {
    let url = `${this.restRoot}${clusterModel.dc}/cluster/${clusterModel.cluster}/k8s/nodes/${node_name}`;

    return this._http.get(url)
      .map(res => res.json());
  }
}
