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
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {shareReplay} from 'rxjs/operators';

import {environment} from '@environments/environment';
import {ResourceLabelMap} from '@shared/entity/common';

@Injectable()
export class LabelService {
  private restRoot: string = environment.restRoot;
  private headers: HttpHeaders = new HttpHeaders();

  private systemLabelsCache: Observable<ResourceLabelMap>;

  constructor(private readonly _http: HttpClient) {}

  get systemLabels(): Observable<ResourceLabelMap> {
    const url = `${this.restRoot}/labels/system`;
    if (!this.systemLabelsCache) {
      this.systemLabelsCache = this._http
        .get<ResourceLabelMap>(url, {headers: this.headers})
        .pipe(shareReplay({refCount: true, bufferSize: 1}));
    }
    return this.systemLabelsCache;
  }
}
