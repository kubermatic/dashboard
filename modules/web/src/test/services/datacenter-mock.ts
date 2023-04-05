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

import {Injectable} from '@angular/core';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {find} from 'lodash';
import {Observable, of} from 'rxjs';
import {fakeNodeDatacenters, fakeSeedSettings} from '../data/datacenter';

@Injectable()
export class DatacenterMockService {
  get datacenters(): Observable<Datacenter[]> {
    return of(fakeNodeDatacenters());
  }

  get seeds(): Observable<string[]> {
    return of(['europe-west3-c']);
  }

  getDatacenter(dcName: string): Observable<Datacenter> {
    const dc = find(fakeNodeDatacenters(), ['metadata.name', dcName]) as Datacenter;
    return of(dc);
  }

  seedSettings(_seedName: string): Observable<SeedSettings> {
    return of(fakeSeedSettings());
  }
}
