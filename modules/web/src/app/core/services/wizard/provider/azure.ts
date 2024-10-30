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

import { HttpClient } from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '@shared/model/NodeProviderConstants';
import {Provider} from './provider';
import {
  AzureResourceGroups,
  AzureRouteTables,
  AzureSecurityGroups,
  AzureSizes,
  AzureSubnets,
  AzureVNets,
  AzureZones,
} from '@shared/entity/provider/azure';
import {map} from 'rxjs/operators';

export class Azure extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

    this._setRequiredHeaders(
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID
    );
  }

  clientID(clientID: string): Azure {
    if (clientID) {
      this._headers = this._headers.set(Azure.Header.ClientID, clientID);
    }
    return this;
  }

  clientSecret(clientSecret: string): Azure {
    if (clientSecret) {
      this._headers = this._headers.set(Azure.Header.ClientSecret, clientSecret);
    }
    return this;
  }

  subscriptionID(subscriptionID: string): Azure {
    if (subscriptionID) {
      this._headers = this._headers.set(Azure.Header.SubscriptionID, subscriptionID);
    }
    return this;
  }

  tenantID(tenantID: string): Azure {
    if (tenantID) {
      this._headers = this._headers.set(Azure.Header.TenantID, tenantID);
    }
    return this;
  }

  skuName(skuName: string): Azure {
    if (skuName) {
      this._headers = this._headers.set(Azure.Header.SKUName, skuName);
    }
    return this;
  }

  location(location: string): Azure {
    if (location) {
      this._headers = this._headers.set(Azure.Header.Location, location);
    }
    return this;
  }

  resourceGroup(resourceGroup: string): Azure {
    if (resourceGroup) {
      this._headers = this._headers.set(Azure.Header.ResourceGroup, resourceGroup);
    }
    return this;
  }

  vnet(vnet: string): Azure {
    if (vnet) {
      this._headers = this._headers.set(Azure.Header.VNet, vnet);
    }
    return this;
  }

  credential(credential: string): Azure {
    super._credential(credential);
    return this;
  }

  datacenterName(datacenterName: string): Azure {
    if (datacenterName) {
      this._headers = this._headers.set(Azure.Header.DatacenterName, datacenterName);
    }
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<AzureSizes[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<AzureSizes[]>(this._url, {headers: this._headers});
  }

  resourceGroups(onLoadingCb: () => void = null): Observable<string[]> {
    this._setRequiredHeaders(
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.Location
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/resourcegroups`;
    return this._http
      .get<AzureResourceGroups>(url, {headers: this._headers})
      .pipe(map(resourceGroups => resourceGroups.resourceGroups));
  }

  securityGroups(onLoadingCb: () => void = null): Observable<string[]> {
    this._setRequiredHeaders(
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.ResourceGroup,
      Azure.Header.Location
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/securitygroups`;
    return this._http
      .get<AzureSecurityGroups>(url, {headers: this._headers})
      .pipe(map(securityGroups => securityGroups.securityGroups));
  }

  routeTables(onLoadingCb: () => void = null): Observable<string[]> {
    this._setRequiredHeaders(
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.ResourceGroup,
      Azure.Header.Location
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/routetables`;
    return this._http
      .get<AzureRouteTables>(url, {headers: this._headers})
      .pipe(map(routeTables => routeTables.routeTables));
  }

  vnets(onLoadingCb: () => void = null): Observable<string[]> {
    this._setRequiredHeaders(
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.ResourceGroup,
      Azure.Header.Location
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/vnets`;
    return this._http.get<AzureVNets>(url, {headers: this._headers}).pipe(map(vnets => vnets.virtualNetworks));
  }

  subnets(onLoadingCb: () => void = null): Observable<string[]> {
    this._setRequiredHeaders(
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.ResourceGroup,
      Azure.Header.VNet
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/subnets`;
    return this._http.get<AzureSubnets>(url, {headers: this._headers}).pipe(map(subnets => subnets.subnets));
  }

  availabilityZones(onLoadingCb: () => void = null): Observable<AzureZones> {
    this._setRequiredHeaders(
      Azure.Header.ClientID,
      Azure.Header.ClientSecret,
      Azure.Header.SubscriptionID,
      Azure.Header.TenantID,
      Azure.Header.Location,
      Azure.Header.SKUName
    );

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/availabilityzones`;
    return this._http.get<AzureZones>(url, {headers: this._headers});
  }
}

export namespace Azure {
  export enum Header {
    ClientID = 'ClientID',
    ClientSecret = 'ClientSecret',
    SubscriptionID = 'SubscriptionID',
    TenantID = 'TenantID',
    Location = 'Location',
    ResourceGroup = 'ResourceGroup',
    VNet = 'VirtualNetwork',
    SKUName = 'SKUName',
    DatacenterName = 'DatacenterName',
  }
}
