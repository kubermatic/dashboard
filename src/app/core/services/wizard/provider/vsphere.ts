import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {Provider} from './provider';
import {VSphereFolder, VSphereNetwork} from '../../../../shared/entity/provider/vsphere';

export class VSphere extends Provider {
  private readonly _networksUrl = `${this._restRoot}/providers/vsphere/networks`;
  private readonly _foldersUrl = `${this._restRoot}/providers/vsphere/folders`;

  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(VSphere.Header.Username, VSphere.Header.Password, VSphere.Header.Datacenter);
  }

  username(username: string): VSphere {
    if (username) {
      this._headers = this._headers.set(VSphere.Header.Username, username);
    }
    return this;
  }

  password(password: string): VSphere {
    if (password) {
      this._headers = this._headers.set(VSphere.Header.Password, password);
    }
    return this;
  }

  datacenter(datacenter: string): VSphere {
    if (datacenter) {
      this._headers = this._headers.set(VSphere.Header.Datacenter, datacenter);
    }
    return this;
  }

  credential(credential: string): VSphere {
    super._credential(credential);
    return this;
  }

  networks(onLoadingCb: () => void = null): Observable<VSphereNetwork[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereNetwork[]>(this._networksUrl, {
      headers: this._headers,
    });
  }

  folders(onLoadingCb: () => void = null): Observable<VSphereFolder[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<VSphereFolder[]>(this._foldersUrl, {
      headers: this._headers,
    });
  }
}

export namespace VSphere {
  export enum Header {
    Username = 'Username',
    Password = 'Password',
    Datacenter = 'DatacenterName',
  }
}
