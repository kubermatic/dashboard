import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {DigitaloceanSizes} from '../../../../shared/entity/provider/digitalocean/DropletSizeEntity';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';

export class Digitalocean extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(Digitalocean.Header.Token);
  }

  token(token: string) {
    if (token) this._headers = this._headers.set(Digitalocean.Header.Token, token);
    return this;
  }

  credential(credential: string) {
    super._credential(credential);
    return this;
  }

  flavors(): Observable<DigitaloceanSizes> {
    if (!this._hasRequiredHeaders()) return EMPTY;
    return this._http.get<DigitaloceanSizes>(this._url, {headers: this._headers});
  }
}

export namespace Digitalocean {
  export enum Header {Token = 'DoToken'}
}
