// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Provider} from './provider';
import {
  OpenstackAvailabilityZone,
  OpenstackFlavor,
  OpenstackNetwork,
  OpenstackSecurityGroup,
  OpenstackSubnet,
  OpenstackTenant,
} from '@shared/entity/provider/openstack';

export class Openstack extends Provider {
  private readonly _tenantsUrl = `${this._restRoot}/providers/openstack/tenants`;
  private readonly _securityGroupsUrl = `${this._restRoot}/providers/openstack/securitygroups`;
  private readonly _networksUrl = `${this._restRoot}/providers/openstack/networks`;
  private readonly _availabilityZonesUrl = `${this._restRoot}/providers/openstack/availabilityzones`;
  private _usingApplicationCredentials = false;

  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(
      Openstack.Header.Username,
      Openstack.Header.Password,
      Openstack.Header.Domain,
      Openstack.Header.Datacenter
    );
  }

  credential(credential: string): Openstack {
    super._credential(credential);
    return this;
  }

  username(username: string): Openstack {
    if (username) {
      this._headers = this._headers.set(Openstack.Header.Username, username);
    }
    return this;
  }

  password(password: string): Openstack {
    if (password) {
      this._headers = this._headers.set(Openstack.Header.Password, password);
    }
    return this;
  }

  applicationCredentialID(id: string): Openstack {
    if (id) {
      this._usingApplicationCredentials = true;
      this._headers = this._headers.set(Openstack.Header.ApplicationCredentialID, id);
    }
    return this;
  }

  applicationCredentialPassword(password: string): Openstack {
    if (password) {
      this._usingApplicationCredentials = true;
      this._headers = this._headers.set(Openstack.Header.ApplicationCredentialSecret, password);
    }
    return this;
  }

  domain(domain: string): Openstack {
    if (domain) {
      this._headers = this._headers.set(Openstack.Header.Domain, domain);
    }
    return this;
  }

  datacenter(datacenter: string): Openstack {
    if (datacenter) {
      this._headers = this._headers.set(Openstack.Header.Datacenter, datacenter);
    }
    return this;
  }

  tenant(tenant: string): Openstack {
    if (tenant) {
      this._headers = this._headers.set(Openstack.Header.Tenant, tenant);
    }
    return this;
  }

  tenantID(tenantID: string): Openstack {
    if (tenantID) {
      this._headers = this._headers.set(Openstack.Header.TenantID, tenantID);
    }
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<OpenstackFlavor[]> {
    const tenantHeader = this._headers.get(Openstack.Header.Tenant)
      ? Openstack.Header.Tenant
      : Openstack.Header.TenantID;
    this._addRequiredHeader(tenantHeader);

    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<OpenstackFlavor[]>(this._url, {
      headers: this._headers,
    });
  }

  tenants(onLoadingCb: () => void = null): Observable<OpenstackTenant[]> {
    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<OpenstackTenant[]>(this._tenantsUrl, {
      headers: this._headers,
    });
  }

  securityGroups(onLoadingCb: () => void = null): Observable<OpenstackSecurityGroup[]> {
    const tenantHeader = this._headers.get(Openstack.Header.Tenant)
      ? Openstack.Header.Tenant
      : Openstack.Header.TenantID;
    this._addRequiredHeader(tenantHeader);

    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<OpenstackSecurityGroup[]>(this._securityGroupsUrl, {
      headers: this._headers,
    });
  }

  networks(onLoadingCb: () => void = null): Observable<OpenstackNetwork[]> {
    const tenantHeader = this._headers.get(Openstack.Header.Tenant)
      ? Openstack.Header.Tenant
      : Openstack.Header.TenantID;
    this._addRequiredHeader(tenantHeader);

    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<OpenstackNetwork[]>(this._networksUrl, {
      headers: this._headers,
    });
  }

  subnets(network: string, onLoadingCb: () => void = null): Observable<OpenstackSubnet[]> {
    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders() || !network) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/openstack/subnets?network_id=${network}`;
    return this._http.get<OpenstackSubnet[]>(url, {headers: this._headers});
  }

  availabilityZones(onLoadingCb: () => void = null): Observable<OpenstackAvailabilityZone[]> {
    const tenantHeader = this._headers.get(Openstack.Header.Tenant)
      ? Openstack.Header.Tenant
      : Openstack.Header.TenantID;
    this._addRequiredHeader(tenantHeader);

    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<OpenstackAvailabilityZone[]>(this._availabilityZonesUrl, {
      headers: this._headers,
    });
  }
}

export namespace Openstack {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    ApplicationCredentialID = 'ApplicationCredentialID',
    ApplicationCredentialSecret = 'ApplicationCredentialSecret',
    Domain = 'Domain',
    Datacenter = 'DatacenterName',
    Tenant = 'Tenant',
    TenantID = 'TenantID',
  }
}
