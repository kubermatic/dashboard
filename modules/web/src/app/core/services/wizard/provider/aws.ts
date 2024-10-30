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
import {map} from 'rxjs/operators';

import {NodeProvider} from '@shared/model/NodeProviderConstants';

import {Provider} from './provider';
import {AWSSecurityGroups, AWSSize, AWSSubnet, AWSVPC} from '@shared/entity/provider/aws';

export class AWS extends Provider {
  constructor(http: HttpClient, projectID: string, provider: NodeProvider) {
    super(http, projectID, provider);

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

  assumeRoleARN(assumeRoleARN: string): AWS {
    if (assumeRoleARN) {
      this._headers = this._headers.set(AWS.Header.AssumeRoleARN, assumeRoleARN);
    }
    return this;
  }

  assumeRoleExternalID(assumeRoleExternalID: string): AWS {
    if (assumeRoleExternalID) {
      this._headers = this._headers.set(AWS.Header.AssumeRoleExternalID, assumeRoleExternalID);
    }
    return this;
  }

  region(region: string): AWS {
    if (region) {
      this._headers = this._headers.set(AWS.Header.Region, region);
    }
    return this;
  }

  vpc(vpc: string): AWS {
    if (vpc) {
      this._headers = this._headers.set(AWS.Header.VPC, vpc);
    }
    return this;
  }

  datacenterName(datacenterName: string): AWS {
    if (datacenterName) {
      this._headers = this._headers.set(AWS.Header.DatacenterName, datacenterName);
    }
    return this;
  }

  vpcs(seed: string, onLoadingCb: () => void = null): Observable<AWSVPC[]> {
    if (this._headers.has(AWS.Header.AssumeRoleARN) || this._headers.has(AWS.Header.AssumeRoleExternalID)) {
      this._setRequiredHeaders(
        AWS.Header.AccessKeyID,
        AWS.Header.SecretAccessKey,
        AWS.Header.AssumeRoleARN,
        AWS.Header.AssumeRoleExternalID
      );
    }

    if (!this._hasRequiredHeaders() || !seed) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/vpcs`;
    return this._http
      .get<AWSVPC[]>(url, {headers: this._headers})
      .pipe(map(vpcs => vpcs.map(vpc => Object.assign(new AWSVPC(), vpc))));
  }

  securityGroups(dc: string, onLoadingCb: () => void = null): Observable<string[]> {
    if (this._headers.has(AWS.Header.AssumeRoleARN) || this._headers.has(AWS.Header.AssumeRoleExternalID)) {
      this._setRequiredHeaders(
        AWS.Header.AccessKeyID,
        AWS.Header.SecretAccessKey,
        AWS.Header.AssumeRoleARN,
        AWS.Header.AssumeRoleExternalID
      );
    }

    if (!this._hasRequiredHeaders() || !dc) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${dc}/securitygroups`;
    return this._http
      .get<AWSSecurityGroups>(url, {headers: this._headers})
      .pipe(map(securityGroups => securityGroups.ids));
  }

  subnets(seed: string, onLoadingCb: () => void = null): Observable<AWSSubnet[]> {
    if (this._headers.has(AWS.Header.AssumeRoleARN) || this._headers.has(AWS.Header.AssumeRoleExternalID)) {
      this._setRequiredHeaders(
        AWS.Header.AccessKeyID,
        AWS.Header.SecretAccessKey,
        AWS.Header.VPC,
        AWS.Header.AssumeRoleARN,
        AWS.Header.AssumeRoleExternalID
      );
    }

    if (!this._hasRequiredHeaders() || !seed) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    const url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/${seed}/subnets`;
    return this._http.get<AWSSubnet[]>(url, {headers: this._headers});
  }

  flavors(onLoadingCb: () => void = null): Observable<AWSSize[]> {
    this._setRequiredHeaders(AWS.Header.Region);
    if (!this._hasRequiredHeaders()) {
      return EMPTY;
    }

    if (onLoadingCb) {
      onLoadingCb();
    }

    return this._http.get<AWSSize[]>(this._url, {headers: this._headers});
  }
}

export namespace AWS {
  export enum Header {
    AccessKeyID = 'AccessKeyID',
    SecretAccessKey = 'SecretAccessKey',
    AssumeRoleARN = 'AssumeRoleARN',
    AssumeRoleExternalID = 'AssumeRoleExternalID',
    VPC = 'VPC',
    Region = 'Region',
    DatacenterName = 'DatacenterName',
  }
}
