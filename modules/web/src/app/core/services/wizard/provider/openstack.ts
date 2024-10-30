// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  OpenstackAvailabilityZone,
  OpenstackFlavor,
  OpenstackNetwork,
  OpenstackSecurityGroup,
  OpenstackSubnet,
  OpenstackSubnetPool,
  OpenstackTenant,
  OpenstackServerGroup,
} from '@shared/entity/provider/openstack';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {EMPTY, Observable} from 'rxjs';
import {Provider} from './provider';

@Injectable()
export class Openstack extends Provider {
  private readonly _tenantsUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/tenants`;
  readonly securityGroupsUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/securitygroups`;
  readonly networksUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/networks`;
  readonly availabilityZonesUrl = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/availabilityzones`;
  readonly serverGroupsURL = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/servergroups`;
  private _usingApplicationCredentials = false;

  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

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

  project(project: string): Openstack {
    if (project) {
      this._headers = this._headers.set(Openstack.Header.Project, project);
    }
    return this;
  }

  projectID(projectID: string): Openstack {
    if (projectID) {
      this._headers = this._headers.set(Openstack.Header.ProjectID, projectID);
    }
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<OpenstackFlavor[]> {
    const projectHeader = this._headers.get(Openstack.Header.Project)
      ? Openstack.Header.Project
      : Openstack.Header.ProjectID;
    this._addRequiredHeader(projectHeader);

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
    const projectHeader = this._headers.get(Openstack.Header.Project)
      ? Openstack.Header.Project
      : Openstack.Header.ProjectID;
    this._addRequiredHeader(projectHeader);

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

    return this._http.get<OpenstackSecurityGroup[]>(this.securityGroupsUrl, {
      headers: this._headers,
    });
  }

  serverGroups(onLoadingCb: () => void = null): Observable<OpenstackServerGroup[]> {
    const projectHeader = this._headers.get(Openstack.Header.Project)
      ? Openstack.Header.Project
      : Openstack.Header.ProjectID;
    this._addRequiredHeader(projectHeader);

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

    return this._http.get<OpenstackServerGroup[]>(this.serverGroupsURL, {
      headers: this._headers,
    });
  }

  networks(onLoadingCb: () => void = null): Observable<OpenstackNetwork[]> {
    const projectHeader = this._headers.get(Openstack.Header.Project)
      ? Openstack.Header.Project
      : Openstack.Header.ProjectID;
    this._addRequiredHeader(projectHeader);

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

    return this._http.get<OpenstackNetwork[]>(this.networksUrl, {
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

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/subnets?network_id=${network}`;
    return this._http.get<OpenstackSubnet[]>(url, {headers: this._headers});
  }

  subnetPools(ipVersion: number, onLoadingCb: () => void = null): Observable<OpenstackSubnetPool[]> {
    if (this._usingApplicationCredentials) {
      this._setRequiredHeaders(
        Openstack.Header.ApplicationCredentialID,
        Openstack.Header.ApplicationCredentialSecret,
        Openstack.Header.Datacenter
      );

      this._cleanupOptionalHeaders();
    }

    if (!this._hasRequiredHeaders() || !ipVersion) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/openstack/subnetpools?ip_version=${ipVersion}`;
    return this._http.get<OpenstackSubnetPool[]>(url, {headers: this._headers});
  }

  availabilityZones(onLoadingCb: () => void = null): Observable<OpenstackAvailabilityZone[]> {
    const projectHeader = this._headers.get(Openstack.Header.Project)
      ? Openstack.Header.Project
      : Openstack.Header.ProjectID;
    this._addRequiredHeader(projectHeader);

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

    return this._http.get<OpenstackAvailabilityZone[]>(this.availabilityZonesUrl, {
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
    Project = 'OpenstackProject',
    ProjectID = 'OpenstackProjectID',
  }
}
