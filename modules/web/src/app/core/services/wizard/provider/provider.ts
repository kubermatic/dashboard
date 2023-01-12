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

import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '@environments/environment';
import {NodeProvider} from '@shared/model/NodeProviderConstants';

export abstract class Provider {
  private _requiredHeaders = [];

  protected _headers = new HttpHeaders();
  protected _restRoot = environment.restRoot;
  protected _newRestRoot = environment.newRestRoot;
  protected readonly _url = `${this._newRestRoot}/projects/${this._projectID}/providers/${this._provider}/sizes`;

  protected constructor(
    protected _http: HttpClient,
    protected readonly _projectID: string,
    protected readonly _provider: NodeProvider
  ) {}

  protected _setRequiredHeaders(...headers: any): void {
    this._requiredHeaders = headers;
  }

  protected _addRequiredHeader(header: any): void {
    this._requiredHeaders.push(header);
  }

  protected _hasRequiredHeaders(): boolean {
    return (
      this._headers.get(Provider.SharedHeader.Credential) !== null ||
      this._requiredHeaders.filter(header => this._headers.keys().includes(header)).length ===
        this._requiredHeaders.length
    );
  }

  protected _cleanupOptionalHeaders(): void {
    for (const hKey of this._headers.keys()) {
      if (!this._requiredHeaders.includes(hKey)) {
        this._headers = this._headers.delete(hKey);
      }
    }
  }

  protected _credential(credential: string): void {
    if (credential) {
      this._headers = this._headers.set(Provider.SharedHeader.Credential, credential);
    }
  }
}

export namespace Provider {
  export enum SharedHeader {
    Credential = 'Credential',
  }
}
