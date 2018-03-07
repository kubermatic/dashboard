
import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';
import {Observable} from 'rxjs/Observable';
import {environment} from '../../../../environments/environment';
import {CreateNodeModel} from 'app/shared/model/CreateNodeModel';
import {DataCenterEntity} from 'app/shared/entity/DatacenterEntity';
import {ClusterEntity} from 'app/shared/entity/ClusterEntity';
import {NodeEntity} from 'app/shared/entity/NodeEntity';
import {Auth} from 'app/core/services/auth/auth.service';
import {SSHKeyEntity} from 'app/shared/entity/SSHKeyEntity';
import {OpenStack} from 'openstack-lib';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {DropletSizeResponseEntity} from 'app/shared/entity/digitalocean/DropletSizeEntity';
import {CreateClusterModel} from 'app/shared/model/CreateClusterModel';
import 'rxjs/add/operator/catch';
import {ClusterResourceSummaryChartEntity} from '../../../shared/entity/chart/ClusterResourceSummaryChartEntity';
import {ClusterDiskChartEntity} from '../../../shared/entity/chart/ClusterDiskChartEntity';
import {ClusterMemoryChartEntity} from '../../../shared/entity/chart/ClusterMemoryChartEntity';
import {ClusterCpuChartEntity} from '../../../shared/entity/chart/ClusterCpuChartEntity';

@Injectable()
export class ApiService {

  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  constructor(private http: HttpClient, private auth: Auth) {
    const token = auth.getBearerToken();
    this.headers = this.headers.set('Authorization', 'Bearer ' + token);
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

  getClusterCpuChart(cluster: string): Observable<ClusterCpuChartEntity[]> {
    const url = `${this.restRoot}/cluster/${cluster}/chart/cpu`;

    return this.http.get<ClusterCpuChartEntity[]>(url, {headers: this.headers});
  }

  getClusterMemoryChart(cluster: string): Observable<ClusterMemoryChartEntity[]> {
    const url = `${this.restRoot}/cluster/${cluster}/chart/memory`;

    return this.http.get<ClusterMemoryChartEntity[]>(url, {headers: this.headers});
  }

  getClusterDiskChart(cluster: string): Observable<ClusterDiskChartEntity[]> {
    const url = `${this.restRoot}/cluster/${cluster}/chart/disk`;

    return this.http.get<ClusterDiskChartEntity[]>(url, {headers: this.headers});
  }

  getClusterresourceSummaryChart(cluster: string): Observable<ClusterResourceSummaryChartEntity[]> {
    const url = `${this.restRoot}/cluster/${cluster}/chart/resource`;

    return this.http.get<ClusterResourceSummaryChartEntity[]>(url, {headers: this.headers});
  }
}
