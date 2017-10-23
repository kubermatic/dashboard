import {Injectable} from "@angular/core";
import "rxjs/add/operator/map";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {CreateNodeModel} from "./model/CreateNodeModel";
import {DataCenterEntity} from "./entitiy/DatacenterEntity";
import {ClusterEntity} from "./entitiy/ClusterEntity";
import {NodeEntity} from "./entitiy/NodeEntity";
import {Auth} from "../auth/auth.service";
import {SSHKeyEntity} from "./entitiy/SSHKeyEntity";
import {OpenStack} from 'openstack-lib';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {DropletSizeResponseEntity} from "./entitiy/digitalocean/DropletSizeEntity";
import {CreateClusterModel} from "./model/CreateClusterModel";
import 'rxjs/add/operator/catch';
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {NotificationComponent} from '../notification/notification.component';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private auth: Auth, private store: Store<fromRoot.State>) {
    let token = auth.getBearerToken();
    this.headers = this.headers.set("Authorization", "Bearer " + token);
  }

  getDataCenters(): Observable<DataCenterEntity[]> {
    const url = `${this.restRoot}/dc`;
    return this.http.get<DataCenterEntity[]>(url, { headers: this.headers });
  }

  getDataCenter(dc: string): Observable<DataCenterEntity> {
    const url = `${this.restRoot}/dc/${dc}`;
    return this.http.get<DataCenterEntity>(url, { headers: this.headers });
  }

  getClusters(): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/cluster`;
    return this.http.get<ClusterEntity[]>(url, { headers: this.headers });
  }

  getCluster(cluster: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster/${cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.headers })
  }

  createCluster(createClusterModel: CreateClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster`;
    return this.http.post<ClusterEntity>(url, createClusterModel, { headers: this.headers });
  }

  deleteCluster(cluster: string) {
    const url = `${this.restRoot}/cluster/${cluster}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusterNodes(cluster: string): Observable<NodeEntity[]> {
    const url = `/api/v1/cluster/${cluster}/node`;
    return this.http.get<NodeEntity[]>(url, { headers: this.headers });
  }

  createClusterNode(cluster: ClusterEntity, nodeModel: CreateNodeModel): Observable<NodeEntity> {
    const url = `${this.restRoot}/cluster/${cluster.metadata.name}/node`;
    return this.http.post<NodeEntity>(url, nodeModel, { headers: this.headers });
  }

  deleteClusterNode(cluster: string, node_name: string) {
    const url = `${this.restRoot}/cluster/${cluster}/node/${node_name}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/ssh-keys`;
    return this.http.get<SSHKeyEntity[]>(url, { headers: this.headers });
  }

  deleteSSHKey(fingerprint: string) {
    const url = `${this.restRoot}/ssh-keys/${fingerprint}`;
    return this.http.delete(url, { headers: this.headers });
  }

  addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
    const url = `${this.restRoot}/ssh-keys`;
    return this.http.post<SSHKeyEntity>(url, sshKey, { headers: this.headers });
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

  getClusterUpgrades(cluster: string): Observable<string[]> {
    const url = `${this.restRoot}/cluster/${cluster}/upgrades`;
    return this.http.get<string[]>(url, {headers: this.headers})
      .catch(error => {
        return Observable.of<string[]>([]);
      });
  }

  updateClusterUpgrade(cluster: string, upgradeVersion: string): void {
    let body = { to: upgradeVersion };
    const url = `${this.restRoot}/cluster/${cluster}/upgrade`;
    this.http.put(url, body, {headers: this.headers})
     .subscribe(result => NotificationComponent.success(this.store, 'Success', `Cluster ${cluster} was upgraded`));
  }
}
