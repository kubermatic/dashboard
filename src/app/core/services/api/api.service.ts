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
import { OpenstackFlavor } from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import { DigitaloceanSizes } from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';

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
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/node?hideInitialConditions=true`;
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

  getDigitaloceanSizes(token: string): Observable<DigitaloceanSizes> {
    this.headers = this.headers.set('DoToken', token);
    const url = `${this.restRoot}/digitalocean/sizes`;
    return this.http.get<DigitaloceanSizes>(url, { headers: this.headers });
  }

  getClusterUpgrades(cluster: string, dc: string): Observable<string[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/upgrades`;
    return this.http.get<string[]>(url, { headers: this.headers })
      .catch(error => {
        return Observable.of<string[]>([]);
      });
  }

  updateClusterUpgrade(cluster: string, dc: string, upgradeVersion: string): Observable<ClusterEntity> {
    const body = { to: upgradeVersion };
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/upgrade`;
    return this.http.put<ClusterEntity>(url, body, { headers: this.headers });
  }

  getOpenStackFlavors(username: string, password: string, tenant: string, domain: string, datacenterName: string): Observable<OpenstackFlavor[]> {
    this.headers = this.headers.set('Username', username);
    this.headers = this.headers.set('Password', password);
    this.headers = this.headers.set('Tenant', tenant);
    this.headers = this.headers.set('Domain', domain);
    this.headers = this.headers.set('DatacenterName', datacenterName);
    const url = `${this.restRoot}/openstack/sizes`;
    return this.http.get<OpenstackFlavor[]>(url, { headers: this.headers });
  }
}
