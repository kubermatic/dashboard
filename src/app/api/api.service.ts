import {Injectable} from "@angular/core";
import {Http, Headers} from "@angular/http";
import "rxjs/add/operator/map";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {CreateNodeModel} from "./model/CreateNodeModel";
import {ClusterModel} from "./model/ClusterModel";
import {DataCenterEntity} from "./entitiy/DatacenterEntity";
import {ClusterEntity} from "./entitiy/ClusterEntity";
import {NodeEntity} from "./entitiy/NodeEntity";
import {Auth} from "../auth/auth.service";
import {SSHKeyEntity} from "./entitiy/SSHKeyEntity";
import {CreateClusterModel} from "./model/CreateClusterModel";
import {OpenStack} from 'openstack-lib';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: Headers = new Headers();

  constructor(private _http: Http, private _auth: Auth) {
    // TODO: Not until id_token is ready!
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

  getClusters(): Observable<ClusterEntity[]> {
    let dcCache: DataCenterEntity[];

    return this.getDataCenters()
      .map(dcs => dcs.filter(result => result.seed))
      .flatMap(dcs => {
        dcCache = dcs;

        return Observable.forkJoin(dcs.map(dc => this.getClustersByDC(dc.metadata.name)));
      })
      .map(clusterLists => clusterLists.map(
        (clusterList, index) => clusterList.map(
          cl => Object.assign({}, cl, {dc: dcCache[index]}))
        )
      )
      .map(clusters => [].concat(...clusters));
  }

  private getClustersByDC(seedRegion: string): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/dc/${seedRegion}/cluster`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getCluster(clusterModel: ClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusterWithDatacenter(clusterModel: ClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;
    let clCache;

    return this._http.get(url, {headers: this.headers})
      .map(res => clCache = res.json())
      .flatMap((clCache) => {

        if(!!clCache.spec.cloud) {
          return this._http.get(`${this.restRoot}/dc/${clCache.spec.cloud.dc}`, {headers: this.headers})
            .map((dcRes) => {
              return Object.assign({}, clCache, {dc: dcRes.json()})
            });
        }

        return Observable.of(clCache);
      });
  }

  createCluster(createClusterModel: CreateClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster`;

    return this._http.post(url, createClusterModel, { headers: this.headers })
      .map(res => res.json());
  }

  setCloudProvider(clusterModel: ClusterModel, node_dc: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/cloud`;

    return this._http.put(url, {dc: node_dc}, { headers: this.headers })
      .map(res => res.json());
  }

  deleteCluster(clusterModel: ClusterModel) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;

    return this._http.delete(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusterNodes(clusterModel: ClusterModel): Observable<NodeEntity[]> {
    const url = `/api/v2/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  getClusterNode(clusterModel: ClusterModel, node_name: string): Observable<NodeEntity> {
    const url = `/api/v2/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;

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
    const url = `${this.restRoot}/ssh-keys?format=json`;

    return this._http.get(url, { headers: this.headers })
      .map(res => res.json());
  }

  deleteSSHKey(fingerprint: string) {
    const url = `${this.restRoot}/ssh-keys/${fingerprint}`;

    return this._http.delete(url, { headers: this.headers })
      .map(res => res.json());
  }

  addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    const url = `${this.restRoot}/ssh-keys`;

    return this._http.post(url, sshKey, { headers: this.headers })
      .map(res => res.json());
  }


  getDigitaloceanSizes(token: string)  {
    const url = `${environment.digitalOceanRestRoot}/sizes`;

    return this._http.get(url, { headers: new Headers({"Authorization": "Bearer " + token}) })
      .map(res => res.json());
  }

  getDigitaloceanSshKeys(token: string){
    const url = `${environment.digitalOceanRestRoot}/account/keys`;

    return this._http.get(url, { headers: new Headers({"Authorization": "Bearer " + token}) })
      .map(res => res.json());
  }


  getOpenStackImages(location: string, project: string, name: string, password: string, authUrl: string) {

    const openStack = new OpenStack({
      region_name: location,
      auth: {
        username: name,
        password: password,
        project_name: project,
        auth_url: authUrl
      }
    });

    // List all flavors
    openStack.networkList().then((networks) => {
      console.log(networks);
      return networks;
    });



  }
}
