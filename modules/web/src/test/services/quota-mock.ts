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
import {Quota, QuotaDetails, QuotaVariables} from '@shared/entity/quota';
import {GetQuotasMock} from '../data/quota';

export class QuotaMockService {
  private _quotas = GetQuotasMock();

  get quotas(): Observable<QuotaDetails[]> {
    return of(this._quotas);
  }

  createQuota(_payload: Quota): Observable<Record<string, never>> {
    return of({});
  }

  updateQuota(_quotaName: string, _payload: QuotaVariables): Observable<Record<string, never>> {
    return of({});
  }

  deleteQuota(_quotaName: string): Observable<Record<string, never>> {
    return of({});
  }

  refreshQuotas(): void {}
}
