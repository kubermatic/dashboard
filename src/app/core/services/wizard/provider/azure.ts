import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {AzureSizes} from '../../../../shared/entity/provider/azure/AzureSizeEntity';
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
    if (clientID) this._headers = this._headers.set(Azure.Header.ClientID, clientID);
    return this;
  }

  clientSecret(clientSecret: string): Azure {
    if (clientSecret) this._headers = this._headers.set(Azure.Header.ClientSecret, clientSecret);
    return this;
  }

  subscriptionID(subscriptionID: string): Azure {
    if (subscriptionID) this._headers = this._headers.set(Azure.Header.SubscriptionID, subscriptionID);
    return this;
  }

  tenantID(tenantID: string): Azure {
    if (tenantID) this._headers = this._headers.set(Azure.Header.TenantID, tenantID);
    return this;
  }

  location(location: string): Azure {
    if (location) this._headers = this._headers.set(Azure.Header.Location, location);
    return this;
  }

  credential(credential: string): Azure {
    super._credential(credential);
    return this;
  }

  flavors(): Observable<AzureSizes[]> {
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<AzureSizes[]>(this._url, {headers: this._headers});
  }
}

export namespace Azure {
  export enum Header {
    ClientID = 'ClientID',
    ClientSecret = 'ClientSecret',
    SubscriptionID = 'SubscriptionID',
    TenantID = 'TenantID',
    Location = 'Location',
  }
}
