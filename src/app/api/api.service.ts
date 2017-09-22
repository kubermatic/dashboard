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
import 'rxjs/add/operator/catch';
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {NotificationComponent} from '../notification/notification.component';
import {CustomHttpService} from '../services';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: CustomHttpService, private auth: Auth, private store: Store<fromRoot.State>) {
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
    return this.http.get<ClusterEntity[]>(url, { headers: this.headers });
  }

  getCluster(clusterModel: ClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.headers })
  }

  createCluster(createClusterModel: CreateClusterModel): Observable<ClusterEntity> {
    const url = `${this.restRoot}/cluster`;
    return this.http.post<ClusterEntity>(url, createClusterModel, { headers: this.headers });
  }

  deleteCluster(clusterModel: ClusterModel) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusterNodes(clusterModel: ClusterModel): Observable<NodeEntity[]> {
    const url = `/api/v1/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node`;
    return this.http.get<NodeEntity[]>(url, { headers: this.headers });
  }

  createClusterNode(cluster: ClusterEntity, nodeModel: CreateNodeModel): Observable<NodeEntity> {
    const url = `${this.restRoot}/dc/${cluster.seed}/cluster/${cluster.metadata.name}/node`;
    return this.http.post<NodeEntity>(url, nodeModel, { headers: this.headers });
  }

  deleteClusterNode(clusterModel: ClusterModel, node_name: string) {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/node/${node_name}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getSSHKeys(): Observable<SSHKeyEntity[]> {
    const url = `${this.restRoot}/ssh-keys?format=json`;
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

  getClusterUpgrades(clusterModel: ClusterModel): Observable<string[]> {
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/upgrades`;
    return this.http.get<string[]>(url, {headers: this.headers});
  }

  updateClusterUpgrade(clusterModel: ClusterModel, upgradeVersion: string): void {
    let body = { to: upgradeVersion };
    const url = `${this.restRoot}/dc/${clusterModel.dc}/cluster/${clusterModel.cluster}/upgrade`;
    this.http.put(url, body, {headers: this.headers})
      .subscribe({error: error => NotificationComponent.error(this.store, 'Error', `${error.status} ${error.statusText}`)});
  }
}
