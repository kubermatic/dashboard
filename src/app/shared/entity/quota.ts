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

export class QuotaVariables {
  cpu?: number;
  memory?: number;
  storage?: number;
}

export class QuotaStatus {
  globalUsage: QuotaVariables | Record<string, never>;
  localUsage: QuotaVariables | Record<string, never>;
}

export class Quota {
  quota: QuotaVariables;
  subjectKind: string;
  subjectName: string;
}

export class QuotaDetails extends Quota {
  name: string;
  subjectHumanReadableName?: string;
  status: QuotaStatus;
}
