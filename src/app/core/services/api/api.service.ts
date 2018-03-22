import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../../environments/environment';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { ClusterEntity } from 'app/shared/entity/ClusterEntity';
import { NodeEntity, NodeEntityV2 } from 'app/shared/entity/NodeEntity';
import { Auth } from 'app/core/services/auth/auth.service';
import { SSHKeyEntity } from 'app/shared/entity/SSHKeyEntity';
import { OpenStack } from 'openstack-lib';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DropletSizeResponseEntity } from 'app/shared/entity/digitalocean/DropletSizeEntity';
import { CreateClusterModel } from 'app/shared/model/CreateClusterModel';
import { DatacenterService } from '../datacenter/datacenter.service';
import 'rxjs/add/operator/catch';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private restRootV3: string = environment.restRootV3;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private auth: Auth, public dcService: DatacenterService) {
    const token = auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
  }

  getClusters(dc: string): Observable<ClusterEntity[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster`;
    return this.http.get<ClusterEntity[]>(url, { headers: this.headers });
  }

  getCluster(cluster: string, dc: string): Observable<ClusterEntity> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.headers });
  }

  createCluster(createClusterModel: CreateClusterModel, dc: string): Observable<ClusterEntity> {
    const url = `${this.restRootV3}/dc/${dc}/cluster`;
    return this.http.post<ClusterEntity>(url, createClusterModel, { headers: this.headers });
  }

  deleteCluster(cluster: string, dc: string) {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusterNodes(cluster: string, dc: string): Observable<NodeEntityV2[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/node`;
    return this.http.get<NodeEntityV2[]>(url, { headers: this.headers });
  }

  createClusterNode(cluster: ClusterEntity, nodeModel: CreateNodeModel, dc: string): Observable<NodeEntityV2> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster.metadata.name}/node`;
    return this.http.post<NodeEntityV2>(url, nodeModel, { headers: this.headers });
  }

  deleteClusterNode(cluster: string, node: NodeEntityV2, dc: string) {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/node/${node.metadata.name}`;
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

  getDigitaloceanSizes(token: string): Observable<any> {
    this.headers = this.headers.set('DoToken', token);
    const url = `${this.restRoot}/digitalocean/sizes`;
    return this.http.get(url, { headers: this.headers });
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
    const body = { to: upgradeVersion };
    const url = `${this.restRoot}/cluster/${cluster}/upgrade`;
    this.http.put(url, body, {headers: this.headers})
     .subscribe(result => NotificationActions.success('Success', `Cluster ${cluster} was upgraded`));
  }
}
