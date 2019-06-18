import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {OpenstackFlavor, OpenstackNetwork, OpenstackSecurityGroup, OpenstackSubnet, OpenstackTenant} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class Openstack extends Provider {
  private readonly _tenantsUrl = `${this._restRoot}/providers/openstack/tenants`;
  private readonly _securityGroupsUrl = `${this._restRoot}/providers/openstack/securitygroups`;
  private readonly _networksUrl = `${this._restRoot}/providers/openstack/networks`;

  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(
        Openstack.Header.Username,
        Openstack.Header.Password,
        Openstack.Header.Domain,
        Openstack.Header.Datacenter,
        Openstack.Header.Tenant,
    );
  }

  credential(credential: string) {
    super._credential(credential);
    return this;
  }

  username(username: string) {
    if (username) this._headers.set(Openstack.Header.Username, username);
    return this;
  }

  password(password: string) {
    if (password) this._headers.set(Openstack.Header.Password, password);
    return this;
  }

  domain(domain: string) {
    if (domain) this._headers.set(Openstack.Header.Domain, domain);
    return this;
  }

  datacenter(datacenter: string) {
    if (datacenter) this._headers.set(Openstack.Header.Datacenter, datacenter);
    return this;
  }

  tenant(tenant: string) {
    if (tenant) this._headers.set(Openstack.Header.Tenant, tenant);
    return this;
  }

  flavors(): Observable<OpenstackFlavor[]> {
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<OpenstackFlavor[]>(this._url, {headers: this._headers});
  }

  tenants(): Observable<OpenstackTenant[]> {
    this._setRequiredHeaders(
        Openstack.Header.Username, Openstack.Header.Password, Openstack.Header.Domain, Openstack.Header.Datacenter);
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<OpenstackTenant[]>(this._tenantsUrl, {headers: this._headers});
  }

  securityGroups(): Observable<OpenstackSecurityGroup[]> {
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<OpenstackSecurityGroup[]>(this._securityGroupsUrl, {headers: this._headers});
  }

  networks(): Observable<OpenstackNetwork[]> {
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<OpenstackNetwork[]>(this._networksUrl, {headers: this._headers});
  }

  subnets(network: string): Observable<OpenstackSubnet[]> {
    if (!this._hasRequiredHeaders() || !network) return EMPTY;
    const url = `${this._restRoot}/providers/openstack/subnets?network_id=${network}`;
    return this._http.get<OpenstackSubnet[]>(url, {headers: this._headers});
  }
}

export namespace Openstack {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    Domain = 'Domain',
    Datacenter = 'DatacenterName',
    Tenant = 'Tenant',
  }
}
