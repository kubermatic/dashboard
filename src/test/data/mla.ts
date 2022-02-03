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

import {AlertmanagerConfig, RuleGroup, RuleGroupType} from '@shared/entity/mla';

export function fakeAlertmanagerConfig(): AlertmanagerConfig {
  return {
    spec: {
      config:
        'Z2xvYmFsOg0KICBzbXRwX3NtYXJ0aG9zdDogJ2xvY2FsaG9zdDoyNScNCiAgc210cF9mcm9tOiAndGVzdEBleGFtcGxlLm9yZycNCnJvdXRlOg0KICByZWNlaXZlcjogInRlc3QiDQpyZWNlaXZlcnM6DQogIC0gbmFtZTogInRlc3QiDQogICAgZW1haWxfY29uZmlnczoNCiAgICAtIHRvOiAndGVzdEBleGFtcGxlLm9yZyc=',
    },
  };
}

export function fakeRuleGroups(): RuleGroup[] {
  return [
    {
      name: 'example',
      data: 'bmFtZTogZXhhbXBsZQpydWxlczoKICAtIGFsZXJ0OiBIaWdoVGhyb3VnaHB1dExvZ1N0cmVhbXMKICAgIGV4cHI6IHN1bSBieShjb250YWluZXIpKHJhdGUoe2pvYj1+Imt1YmUtc3lzdGVtLy4qIn1bMW1dKSkgPiA1MAogICAgZm9yOiAxbQ==',
      type: RuleGroupType.Logs,
    },
    {
      name: 'example2',
      data: 'bmFtZTogZXhhbXBsZTIKcnVsZXM6CiAgLSBhbGVydDogSGlnaFRocm91Z2hwdXRMb2dTdHJlYW1zCiAgICBleHByOiBzdW0gYnkoY29udGFpbmVyKShyYXRlKHtqb2I9fiJrdWJlLXN5c3RlbS8uKiJ9WzFtXSkpID4gNTAKICAgIGZvcjogMW0=',
      type: RuleGroupType.Metrics,
    },
  ];
}
