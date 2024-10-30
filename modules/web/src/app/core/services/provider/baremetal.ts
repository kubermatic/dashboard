// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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
import {Injectable} from '@angular/core';
import {environment} from '@environments/environment';
import {TinkerbellOSImageList} from '@shared/entity/provider/baremetal';
import {Observable} from 'rxjs';

@Injectable()
export class BaremetalService {
  private readonly _newRestRoot: string = environment.newRestRoot;

  constructor(private readonly _httpClient: HttpClient) {}

  getOSImages(dc: string): Observable<TinkerbellOSImageList> {
    const url = `${this._newRestRoot}/providers/baremetal/tinkerbell/dc/${dc}/images`;
    return this._httpClient.get<TinkerbellOSImageList>(url);
  }
}
