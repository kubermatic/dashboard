import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/catch';
import { Auth } from '../../../core/services/auth/auth.service';
import { ClusterEntity, MasterVersion } from '../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { CreateProjectModel } from '../../../shared/model/CreateProjectModel';
import { CreateClusterModel } from '../../../shared/model/CreateClusterModel';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';
import { OpenstackFlavor, OpenstackTenant } from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import { DigitaloceanSizes } from '../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import { AzureSizes } from '../../../shared/entity/provider/azure/AzureSizeEntity';

@Injectable()
export class ApiService {
  private restRoot: string = environment.restRoot;
  private restRootV3: string = environment.restRootV3;
  private headers: HttpHeaders = new HttpHeaders();
  private token: string;

  constructor(private http: HttpClient, private auth: Auth) {
    this.token = auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + this.token);
  }

  getProjects(): Observable<ProjectEntity[]> {
    const url = `${this.restRoot}/projects`;
    return this.http.get<ProjectEntity[]>(url, { headers: this.headers });
  }

  createProject(createProjectModel: CreateProjectModel): Observable<ProjectEntity> {
    const url = `${this.restRoot}/projects`;
    return this.http.post<ProjectEntity>(url, createProjectModel, { headers: this.headers });
  }

  deleteProject(projectID: string) {
    const url = `${this.restRoot}/projects/${projectID}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusters(dc: string, projectID: string): Observable<ClusterEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters`;
    return this.http.get<ClusterEntity[]>(url, { headers: this.headers });
  }

  getCluster(cluster: string, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    return this.http.get<ClusterEntity>(url, { headers: this.headers });
  }

  createCluster(createClusterModel: CreateClusterModel, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters`;
    return this.http.post<ClusterEntity>(url, createClusterModel, { headers: this.headers });
  }

  editCluster(cluster: ClusterEntity, dc: string, projectID: string): Observable<ClusterEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}`;
    return this.http.put<ClusterEntity>(url, cluster, { headers: this.headers });
  }

  deleteCluster(cluster: string, dc: string, projectID: string) {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}`;
    return this.http.delete(url, { headers: this.headers });
  }

  getClusterNodes(cluster: string, dc: string, projectID: string): Observable<NodeEntity[]> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes?hideInitialConditions=true`;
    return this.http.get<NodeEntity[]>(url, { headers: this.headers });
  }

  createClusterNode(cluster: ClusterEntity, node: NodeEntity, dc: string, projectID: string): Observable<NodeEntity> {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster.id}/nodes`;
    return this.http.post<NodeEntity>(url, node, { headers: this.headers });
  }

  deleteClusterNode(cluster: string, node: NodeEntity, dc: string, projectID: string) {
    const url = `${this.restRoot}/projects/${projectID}/dc/${dc}/clusters/${cluster}/nodes/${node.metadata.name}`;
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

  getClusterUpgrades(cluster: string, dc: string): Observable<MasterVersion[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/upgrades`;
    return this.http.get<MasterVersion[]>(url, { headers: this.headers })
      .catch(error => {
        return Observable.of<MasterVersion[]>([]);
      });
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

  getOpenStackTenants(username: string, password: string, domain: string, datacenterName: string): Observable<OpenstackTenant[]> {
    this.headers = this.headers.set('Username', username);
    this.headers = this.headers.set('Password', password);
    this.headers = this.headers.set('Domain', domain);
    this.headers = this.headers.set('DatacenterName', datacenterName);
    const url = `${this.restRoot}/openstack/tenants`;
    return this.http.get<OpenstackTenant[]>(url, { headers: this.headers });
  }

  getKubeconfigURL(dc: string, cluster: string): string {
    return `${environment.restRootV3}/dc/${dc}/cluster/${cluster}/kubeconfig?token=${this.token}`;
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    const url = `${this.restRoot}/versions`;
    return this.http.get<MasterVersion[]>(url, { headers: this.headers });
  }

  getAzureSizes(clientID: string, clientSecret: string, subscriptionID: string, tenantID: string, location: string): Observable<AzureSizes> {
    this.headers = this.headers.set('ClientID', clientID);
    this.headers = this.headers.set('ClientSecret', clientSecret);
    this.headers = this.headers.set('SubscriptionID', subscriptionID);
    this.headers = this.headers.set('TenantID', tenantID);
    this.headers = this.headers.set('Location', location);
    const url = `${this.restRoot}/azure/sizes`;
    return this.http.get<AzureSizes>(url, { headers: this.headers });
  }
}
