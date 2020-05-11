import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {AzureSizes, AzureZones} from '../../../../shared/entity/provider/azure/AzureSizeEntity';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class Azure extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(
        Azure.Header.ClientID,
        Azure.Header.ClientSecret,
        Azure.Header.SubscriptionID,
        Azure.Header.TenantID,
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

  credential(credential: string): Azure {
    super._credential(credential);
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

  availabilityZones(onLoadingCb: () => void = null): Observable<AzureZones> {
    this._setRequiredHeaders(
        Azure.Header.ClientID, Azure.Header.ClientSecret, Azure.Header.SubscriptionID, Azure.Header.TenantID,
        Azure.Header.Location, Azure.Header.SKUName);

    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/availabilityzones`;
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
    SKUName = 'SKUName',
  }
}
