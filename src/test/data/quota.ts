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

import {QuotaDetails} from '@shared/entity/quota';

const QuotaMock: QuotaDetails = {
  name: 'project-q4vgtz2rzh',
  subjectName: 'q4vgtz2rzh',
  subjectKind: 'project',
  quota: {
    cpu: '10',
    memory: '10Gi',
  },
  status: {
    globalUsage: {},
    localUsage: {},
  },
};

// eslint-disable-next-line @typescript-eslint/no-magic-numbers
export const GetQuotasMock = () => Array<QuotaDetails>(10).fill(QuotaMock);
