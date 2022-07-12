// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import {QuotaDetails, Quota, QuotaVariables} from '@shared/entity/quota';

import {QuotasMock} from '../data/quotas.mock';

export class QuotaServiceMock {
  private _quotas = QuotasMock;

  get quotas(): Observable<QuotaDetails[]> {
    return of(this._quotas);
  }

  _getQuotas(): Observable<QuotaDetails[]> {
    return of(this._quotas);
  }

  refreshQuotas(): void {
    return null;
  }

  createQuota(payload: Quota): Observable<Record<string, never>> {
    return of(payload).pipe(map(() => ({})));
  }

  updateQuota(quotaName: string, payload: QuotaVariables): Observable<Record<string, never>> {
    return of({quotaName, payload}).pipe(map(() => ({})));
  }
}
