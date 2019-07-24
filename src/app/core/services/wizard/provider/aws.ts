import {HttpClient} from '@angular/common/http';
import {EMPTY, Observable} from 'rxjs';

import {AWSAvailabilityZone} from '../../../../shared/entity/provider/aws/AWS';
import {NodeInstanceFlavor, NodeInstanceFlavors, NodeProvider} from '../../../../shared/model/NodeProviderConstants';

import {Provider} from './provider';

export class AWS extends Provider {
  constructor(http: HttpClient, provider: NodeProvider) {
    super(http, provider);

    this._setRequiredHeaders(AWS.Header.AccessKeyID, AWS.Header.SecretAccessKey);
  }

  credential(credential: string): AWS {
    super._credential(credential);
    return this;
  }

  accessKeyID(accessKeyID: string): AWS {
    if (accessKeyID) {
      this._headers = this._headers.set(AWS.Header.AccessKeyID, accessKeyID);
    }
    return this;
  }

  secretAccessKey(secretAccessKey: string): AWS {
    if (secretAccessKey) {
      this._headers = this._headers.set(AWS.Header.SecretAccessKey, secretAccessKey);
    }
    return this;
  }

  zones(dc: string): Observable<AWSAvailabilityZone[]> {
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }
    const url = `${this._restRoot}/providers/${this._provider}/${dc}/zones`;
    return this._http.get<AWSAvailabilityZone[]>(url, {headers: this._headers});
  }

  flavors(): NodeInstanceFlavor[] {
    return NodeInstanceFlavors.AWS;
  }
}

export namespace AWS {
  export enum Header {
    AccessKeyID = 'AccessKeyID',
    SecretAccessKey = 'SecretAccessKey',
  }
}
