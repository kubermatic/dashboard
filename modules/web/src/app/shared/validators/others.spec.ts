// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {FormControl} from '@angular/forms';
import {CBSL_SYNC_PERIOD, CLUSTER_BACKUP_EXPIRES_IN} from './others';

const validDurations = [
  '0',
  '7d',
  '1d12h',
  '7d0h',
  '7d0h0m0s',
  '1d30m',
  '168h',
  '120h0m0s',
  '24h10m10s',
  '1h30m',
  '1h05m',
  '5m',
  '120m',
  '2m10s',
  '90s',
];
const invalidDurations = [
  '1.5h',
  '1.5d',
  '500ms',
  '30m1h',
  '24h1d',
  '1d24h',
  '7d5555m',
  '10',
  '24h10m10',
  ' 1h',
  '1h120m',
  '2m90s',
  '123h5555m123s',
  '193h99m99s',
  '100h120m600s',
  '1233h55333m1290s',
];

describe('BACKUP_DURATION_PATTERN', () => {
  it('CLUSTER_BACKUP_EXPIRES_IN should accept day/hour/minute/second durations of any length', () => {
    validDurations.forEach(value => {
      expect(CLUSTER_BACKUP_EXPIRES_IN({value} as FormControl)).toBe(null);
    });
  });

  it('CLUSTER_BACKUP_EXPIRES_IN should reject unnormalized, unordered or non-d/h/m/s values', () => {
    invalidDurations.forEach(value => {
      expect(CLUSTER_BACKUP_EXPIRES_IN({value} as FormControl)).not.toBe(null);
    });
  });

  it('CBSL_SYNC_PERIOD should accept the same durations', () => {
    validDurations.forEach(value => {
      expect(CBSL_SYNC_PERIOD({value} as FormControl)).toBe(null);
    });
  });

  it('CBSL_SYNC_PERIOD should reject the same durations', () => {
    invalidDurations.forEach(value => {
      expect(CBSL_SYNC_PERIOD({value} as FormControl)).not.toBe(null);
    });
  });
});
