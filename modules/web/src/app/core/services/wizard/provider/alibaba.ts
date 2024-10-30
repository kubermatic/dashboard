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
import {AlibabaInstanceType, AlibabaZone, AlibabaVSwitch} from '@shared/entity/provider/alibaba';

export class Alibaba extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

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

  datacenterName(datacenterName: string): Alibaba {
    if (datacenterName) {
      this._headers = this._headers.set(Alibaba.Header.DatacenterName, datacenterName);
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

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/instancetypes`;
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

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/zones`;
    return this._http.get<AlibabaZone[]>(url, {headers: this._headers});
  }

  vSwitches(onLoadingCb: () => void = null): Observable<AlibabaVSwitch[]> {
    this._setRequiredHeaders(Alibaba.Header.AccessKeyID, Alibaba.Header.AccessKeySecret, Alibaba.Header.Region);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/vswitches`;
    return this._http.get<AlibabaVSwitch[]>(url, {headers: this._headers});
  }
}

export namespace Alibaba {
  export enum Header {
    AccessKeyID = 'AccessKeyID',
    AccessKeySecret = 'AccessKeySecret',
    Region = 'Region',
    DatacenterName = 'DatacenterName',
  }
}
