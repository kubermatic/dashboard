import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/catch';
import { Auth } from 'app/core/services/auth/auth.service';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { CreateClusterModel } from '../../../shared/model/CreateClusterModel';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';

@Injectable()
export class ApiService {
  private restRoot: string = environment.restRoot;
  private restRootV3: string = environment.restRootV3;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private auth: Auth) {
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

  editCluster(cluster: ClusterEntity, dc: string): Observable<ClusterEntity> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster.metadata.name}`;
    return this.http.put<ClusterEntity>(url, cluster, { headers: this.headers });
  }

  deleteCluster(cluster: string, dc: string) {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusterNodes(cluster: string, dc: string): Observable<NodeEntity[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/node`;
    return this.http.get<NodeEntity[]>(url, { headers: this.headers });
  }

  createClusterNode(cluster: ClusterEntity, node: NodeEntity, dc: string): Observable<NodeEntity> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster.metadata.name}/node`;
    return this.http.post<NodeEntity>(url, node, { headers: this.headers });
  }

  deleteClusterNode(cluster: string, node: NodeEntity, dc: string) {
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

  getClusterUpgrades(cluster: string, dc: string): Observable<string[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/upgrades`;
    return this.http.get<string[]>(url, { headers: this.headers })
      .catch(error => {
        return Observable.of<string[]>([]);
      });
  }

  updateClusterUpgrade(cluster: string, upgradeVersion: string): Observable<ClusterEntity> {
    const body = { to: upgradeVersion };
    const url = `${this.restRoot}/cluster/${cluster}/upgrade`;
    return this.http.put<ClusterEntity>(url, body, { headers: this.headers });
  }
}
