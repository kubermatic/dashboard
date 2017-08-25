import {Injectable} from "@angular/core";
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
import {OpenStack} from 'openstack-lib';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {DropletSizeResponseEntity} from "./entitiy/digitalocean/DropletSizeEntity";
import {CreateClusterModel} from "./model/CreateClusterModel";

const REFRESH_TOKEN_DELAY = 40000;

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = null;
  private timeoutId: number = null;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    if (this.headers && !this.timeoutId) {
      this.timeoutId = window.setTimeout(() => { 
        this.headers = null;
        this.timeoutId = null;
      }, REFRESH_TOKEN_DELAY);
    }

    return this.headers || (this.headers = new HttpHeaders({
      "Authorization": "Bearer " + Auth.getBearerToken()
    }));
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;
    return this.http.get<DataCenterEntity[]>(url, { headers: this.getHeaders() });
  }

  getDataCenter(dc: string): Observable<DataCenterEntity> {
    const url = `${this.restRoot}/dc/${dc}`;
    return this.http.get<DataCenterEntity>(url, { headers: this.getHeaders() });
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
    return this.http.get<ClusterEntity[]>(url, { headers: this.getHeaders() });
  }

  getCluster(clusterModel: ClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.getHeaders() })
  }

  createCluster(createClusterModel: CreateClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster`;
    return this.http.post<ClusterEntity>(url, createClusterModel, { headers: this.getHeaders() });
  }

  deleteCluster(clusterModel: ClusterModel) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

  getClusterNodes(clusterModel: ClusterModel): Observable<NodeEntity[]> {
    const url = `/api/v1/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;
    return this.http.get<NodeEntity[]>(url, { headers: this.getHeaders() });
  }

  createClusterNode(cluster: ClusterEntity, nodeModel: CreateNodeModel): Observable<NodeEntity> {
    const url = `${this.restRoot}/dc/${cluster.seed}/cluster/${cluster.metadata.name}/node`;
    return this.http.post<NodeEntity>(url, nodeModel, { headers: this.getHeaders() });
  }

  deleteClusterNode(clusterModel: ClusterModel, node_name: string) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/ssh-keys?format=json`;
    return this.http.get<SSHKeyEntity[]>(url, { headers: this.getHeaders() });
  }

  deleteSSHKey(fingerprint: string) {
    const url = `${this.restRoot}/ssh-keys/${fingerprint}`;
    return this.http.delete(url, { headers: this.getHeaders() });
  }

  addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    const url = `${this.restRoot}/ssh-keys`;
    return this.http.post<SSHKeyEntity>(url, sshKey, { headers: this.getHeaders() });
  }

  getDigitaloceanSizes(token: string)  {
    const url = `${environment.digitalOceanRestRoot}/sizes`;
    return this.http.get<DropletSizeResponseEntity>(url, { headers: new HttpHeaders({"Authorization": "Bearer " + token}) });
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
