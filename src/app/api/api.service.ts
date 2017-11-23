import { NotificationActions } from 'app/actions/notification.actions';
import {Injectable} from "@angular/core";
import "rxjs/add/operator/map";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {CreateNodeModel} from "./../shared/model/CreateNodeModel";
import {DataCenterEntity} from "./../shared/entity/DatacenterEntity";
import {ClusterEntity} from "./../shared/entity/ClusterEntity";
import {NodeEntity} from "./../shared/entity/NodeEntity";
import {Auth} from "../core/services/auth/auth.service";
import {SSHKeyEntity} from "./../shared/entity/SSHKeyEntity";
import {OpenStack} from 'openstack-lib';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {DropletSizeResponseEntity} from "./../shared/entity/digitalocean/DropletSizeEntity";
import {CreateClusterModel} from "./../shared/model/CreateClusterModel";
import 'rxjs/add/operator/catch';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private auth: Auth, private notificationActions: NotificationActions) {
    let token = auth.getBearerToken();
    this.headers = this.headers.set("Authorization", "Bearer " + token);
  }

  getClusters(): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/cluster`;
    return this.http.get<ClusterEntity[]>(url, { headers: this.headers });
  }

  getCluster(cluster: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster/${cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.headers });
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
     .subscribe(result => this.notificationActions.success('Success', `Cluster ${cluster} was upgraded`));
  }
}
