import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';
import {HetznerTypes} from '../../../../shared/entity/provider/hetzner';

export class Hetzner extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(Hetzner.Header.Token);
  }

  token(token: string): Hetzner {
    if (token) {
      this._headers = this._headers.set(Hetzner.Header.Token, token);
    }
    return this;
  }

  credential(credential: string): Hetzner {
    super._credential(credential);
    return this;
  }

  flavors(onLoadingCb: () => void = null): Observable<HetznerTypes> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<HetznerTypes>(this._url, {headers: this._headers});
  }
}

export namespace Hetzner {
  export enum Header {
    Token = 'HetznerToken',
  }
}
