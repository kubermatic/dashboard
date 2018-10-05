import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { Observable } from 'rxjs/Observable';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import 'rxjs/add/operator/catch';
import { Auth } from '../../../core/services/auth/auth.service';
import { ClusterEntity, MasterVersion } from '../../../shared/entity/ClusterEntity';
import { CreateClusterModel } from '../../../shared/model/CreateClusterModel';
import { NodeEntity } from '../../../shared/entity/NodeEntity';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';
import {
  OpenstackFlavor, OpenstackNetwork, OpenstackSubnet,
  OpenstackTenant, OpenstackSecurityGroup
} from '../../../shared/entity/provider/openstack/OpenstackSizeEntity';
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

  getDigitaloceanSizesForWizard(token: string): Observable<DigitaloceanSizes> {
    this.headers = this.headers.set('DoToken', token);
    const url = `${this.restRoot}/digitalocean/sizes`;
    return this.http.get<DigitaloceanSizes>(url, { headers: this.headers });
  }

  getDigitaloceanSizes(dc: string, cluster: string): Observable<DigitaloceanSizes> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/digitalocean/sizes`;
    return this.http.get<DigitaloceanSizes>(url, { headers: this.headers });
  }

  getClusterUpgrades(cluster: string, dc: string): Observable<MasterVersion[]> {
    const url = `${this.restRootV3}/dc/${dc}/cluster/${cluster}/upgrades`;
    return this.http.get<MasterVersion[]>(url, { headers: this.headers })
      .catch(error => {
        return Observable.of<MasterVersion[]>([]);
      });
  }

  private setOpenStackHeaders(username: string, password: string, domain: string, datacenterName: string) {
    this.headers = this.headers.set('Username', username);
    this.headers = this.headers.set('Password', password);
    this.headers = this.headers.set('Domain', domain);
    this.headers = this.headers.set('DatacenterName', datacenterName);
  }

  getOpenStackFlavorsForWizard(username: string, password: string, tenant: string, domain: string, datacenterName: string): Observable<OpenstackFlavor[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    this.headers = this.headers.set('Tenant', tenant);
    const url = `${this.restRoot}/openstack/sizes`;
    return this.http.get<OpenstackFlavor[]>(url, { headers: this.headers });
  }

  getOpenStackFlavors(dc: string, cluster: string): Observable<OpenstackFlavor[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/openstack/sizes`;
    return this.http.get<OpenstackFlavor[]>(url, { headers: this.headers });
  }

  getOpenStackTenantsForWizard(username: string, password: string, domain: string, datacenterName: string): Observable<OpenstackTenant[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this.restRoot}/openstack/tenants`;
    return this.http.get<OpenstackTenant[]>(url, { headers: this.headers });
  }

  getOpenStackTenants(dc: string, cluster: string): Observable<OpenstackTenant[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/openstack/tenants`;
    return this.http.get<OpenstackTenant[]>(url, { headers: this.headers });
  }

  getOpenStackSecurityGroupsForWizard(username: string, password: string, domain: string, datacenterName: string): Observable<OpenstackSecurityGroup[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this.restRoot}/openstack/securitygroups`;
    return this.http.get<OpenstackSecurityGroup[]>(url, { headers: this.headers });
  }

  getOpenStackSecurityGroups(dc: string, cluster: string): Observable<OpenstackSecurityGroup[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/openstack/securitygroups`;
    return this.http.get<OpenstackSecurityGroup[]>(url, { headers: this.headers });
  }

  getOpenStackNetworkForWizard(username: string, password: string, domain: string, datacenterName: string): Observable<OpenstackNetwork[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this.restRoot}/openstack/networks`;
    return this.http.get<OpenstackNetwork[]>(url, { headers: this.headers });
  }

  getOpenStackNetwork(dc: string, cluster: string): Observable<OpenstackNetwork[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/openstack/networks`;
    return this.http.get<OpenstackNetwork[]>(url, { headers: this.headers });
  }

  getOpenStackSubnetIdsForWizard(username: string, password: string, domain: string, datacenterName: string, network: string): Observable<OpenstackSubnet[]> {
    this.setOpenStackHeaders(username, password, domain, datacenterName);
    const url = `${this.restRoot}/openstack/subnets?network_id=${network}`;
    return this.http.get<OpenstackSubnet[]>(url, { headers: this.headers });
  }

  getOpenStackSubnetIds(dc: string, cluster: string, network: string): Observable<OpenstackSubnet[]> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/openstack/subnets?network_id=${network}`;
    return this.http.get<OpenstackSubnet[]>(url, { headers: this.headers });
  }

  getKubeconfigURL(dc: string, cluster: string): string {
    return `${environment.restRootV3}/dc/${dc}/cluster/${cluster}/kubeconfig?token=${this.token}`;
  }

  getMasterVersions(): Observable<MasterVersion[]> {
    const url = `${this.restRoot}/versions`;
    return this.http.get<MasterVersion[]>(url, { headers: this.headers });
  }

  getAzureSizesForWizard(clientID: string, clientSecret: string, subscriptionID: string, tenantID: string, location: string): Observable<AzureSizes> {
    this.headers = this.headers.set('ClientID', clientID);
    this.headers = this.headers.set('ClientSecret', clientSecret);
    this.headers = this.headers.set('SubscriptionID', subscriptionID);
    this.headers = this.headers.set('TenantID', tenantID);
    this.headers = this.headers.set('Location', location);
    const url = `${this.restRoot}/azure/sizes`;
    return this.http.get<AzureSizes>(url, { headers: this.headers });
  }

  getAzureSizes(dc: string, cluster: string): Observable<AzureSizes> {
    const url = `${this.restRoot}/dc/${dc}/cluster/${cluster}/azure/sizes`;
    return this.http.get<AzureSizes>(url, { headers: this.headers });
  }
}
