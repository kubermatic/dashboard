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

// Constraint Templates
export class ConstraintTemplate {
  name: string;
  spec: ConstraintTemplateSpec;
  status?: object;
}

export class ConstraintTemplateSpec {
  targets?: object[];
  crd: CRD;
  selector?: object;
}

export class CRD {
  spec: CRDSpec;
}

export class CRDSpec {
  names: Names;
  validation?: object;
}

export class Names {
  kind: string;
  shortNames?: string[];
}

// Constraints
export class Constraint {
  name: string;
  spec: ConstraintSpec;
  status?: ConstraintStatus;
  labels?: object;
}

export class ConstraintStatus {
  enforcement?: string;
  auditTimestamp?: string;
  violations?: Violation[];
  synced?: boolean;
}

export class Violation {
  enforcementAction?: string;
  kind?: string;
  message?: string;
  name?: string;
  namespace?: string;
}

export class ConstraintSpec {
  constraintType: string;
  disabled?: boolean;
  match?: Match;
  parameters?: object;
  selector?: ConstraintSelector;
}

export class Match {
  kinds?: Kind[];
  scope?: string;
  namespaces?: string[];
  excludedNamespaces?: string[];
  labelSelector?: object;
  namespaceSelector?: object;
}

export class Kind {
  kinds?: string[];
  apiGroups?: string[];
}

export class ConstraintSelector {
  providers?: string[];
  labelSelector?: LabelSelector;
}

export class LabelSelector {
  matchExpressions?: MatchExpression[];
  matchLabels?: object;
}

export class MatchExpression {
  key?: string;
  values?: string[];
  operator?: string;
}

// Gatekeeper Config
export class GatekeeperConfig {
  spec: GatekeeperConfigSpec;
}

export class GatekeeperConfigSpec {
  sync?: Sync;
  validation?: GatekeeperValidation;
  match?: MatchEntry[];
  readiness?: ReadinessSpec;
}

export class Sync {
  syncOnly?: GVK[];
}

export class GatekeeperValidation {
  traces?: Trace[];
}

export class Trace {
  user?: string;
  kind?: GVK;
  dump?: string;
}

export class MatchEntry {
  excludedNamespaces?: string[];
  processes?: string[];
}

export class ReadinessSpec {
  statsEnabled?: boolean;
}

export class GVK {
  group?: string;
  version?: string;
  kind?: string;
}
