import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';
import {AlibabaInstanceType, AlibabaZone} from '../../../../shared/entity/provider/alibaba';

export class Alibaba extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(Alibaba.Header.AccessKeyID, Alibaba.Header.AccessKeySecret);
  }

  credential(credential: string): Alibaba {
    super._credential(credential);
    return this;
  }

  accessKeyID(accessKeyID: string): Alibaba {
    if (accessKeyID) {
      this._headers = this._headers.set(Alibaba.Header.AccessKeyID, accessKeyID);
    }
    return this;
  }

  accessKeySecret(accessKeySecret: string): Alibaba {
    if (accessKeySecret) {
      this._headers = this._headers.set(Alibaba.Header.AccessKeySecret, accessKeySecret);
    }
    return this;
  }

  region(region: string): Alibaba {
    if (region) {
      this._headers = this._headers.set(Alibaba.Header.Region, region);
    }
    return this;
  }

  instanceTypes(onLoadingCb: () => void = null): Observable<AlibabaInstanceType[]> {
    this._setRequiredHeaders(Alibaba.Header.AccessKeyID, Alibaba.Header.AccessKeySecret, Alibaba.Header.Region);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/instancetypes`;
    return this._http.get<AlibabaInstanceType[]>(url, {headers: this._headers});
  }

  zones(onLoadingCb: () => void = null): Observable<AlibabaZone[]> {
    this._setRequiredHeaders(Alibaba.Header.AccessKeyID, Alibaba.Header.AccessKeySecret, Alibaba.Header.Region);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._restRoot}/providers/${this._provider}/zones`;
    return this._http.get<AlibabaZone[]>(url, {headers: this._headers});
  }
}

export namespace Alibaba {
  export enum Header {
    AccessKeyID = 'AccessKeyID',
    AccessKeySecret = 'AccessKeySecret',
    Region = 'Region',
  }
}
