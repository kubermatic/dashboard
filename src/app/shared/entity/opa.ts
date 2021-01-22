// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Constraint Templates
export class ConstraintTemplate {
  name: string;
  spec: ConstraintTemplateSpec;
  status?: ConstraintTemplateStatus;
}

export class ConstraintTemplateStatus {
  byPod: ByPodStatus[];
  created: boolean;
}

export class ByPodStatus {
  errors?: CreateCRDError[];
  id: string;
  observedGeneration: number;
}

export class CreateCRDError {
  code: string;
  location: string;
  message: string;
}

export class ConstraintTemplateSpec {
  targets: Target[];
  crd: CRD;
}

export class Target {
  libs: string[];
  rego: string;
  target: string;
}

export class CRD {
  spec: CRDSpec;
}

export class CRDSpec {
  names: Names;
  validation: Validation;
}

export class Names {
  kind: string;
  shortNames: string[];
}

export class Validation {
  openAPIV3Schema: JSONSchemaProps;
}

export class JSONSchemaProps {
  dollarSchema: string;
  allOf: JSONSchemaProps[];
  anyOf: JSONSchemaProps[];
  description: string;
  enum: JSON[];
  exclusiveMaximum: boolean;
  exclusiveMinimum: boolean;
  format: string;
  id: string;
  maxItems: number;
  maxLength: number;
  maxProperties: number;
  maximum: number;
  minItems: number;
  minLength: number;
  minProperties: number;
  minimum: number;
  multipleOf: number;
  nullable: boolean;
  oneOf: JSONSchemaProps[];
  pattern: string;
  patternProperties: object;
  properties: object;
  ref: string;
  required: string[];
  title: string;
  type: string;
  uniqueItems: boolean;
  xEmbeddedResource: boolean;
  xIntOrString: boolean;
  xListMapKeys: string[];
  xListType: string;
  xMapType: string;
  xPreserveUnknownFields: boolean;
  additionalItems: JSONSchemaPropsOrBool;
  additionalProperties: JSONSchemaPropsOrBool;
  default: JSON;
  definitions: object;
  dependencies: object;
  example: JSON;
  externalDocs: ExternalDocumentation;
  items: JSONSchemaPropsOrArray;
  not: JSONSchemaProps;
}

export class JSONSchemaPropsOrBool {
  allows: boolean;
  schema: JSONSchemaProps;
}

export class ExternalDocumentation {
  description: string;
  url: string;
}

export class JSONSchemaPropsOrArray {
  jsonSchemas: JSONSchemaProps[];
  schema: JSONSchemaProps;
}

// Constraints
export class Constraint {
  name: string;
  spec: ConstraintSpec;
  status?: ConstraintStatus;
}

export class ConstraintStatus {
  enforcement: string;
  auditTimestamp: string;
  violations: Violation[];
}

export class Violation {
  enforcementAction: string;
  kind: string;
  message: string;
  name: string;
  namespace: string;
}

export class ConstraintSpec {
  constraintType: string;
  match: Match;
  parameters: Parameters;
}

export class Match {
  kinds: Kind[];
  scope: string;
  namespaces: string[];
  excludedNamespaces: string[];
  labelSelector: LabelSelector;
  namespaceSelector: LabelSelector;
}

export class Kind {
  kinds: string[];
  apiGroups: string[];
}

export class Parameters {
  rawJSON: string;
}

export class LabelSelector {
  matchExpressions: LabelSelectorRequirement[];
  matchLabels: object;
}

export class LabelSelectorRequirement {
  key: string;
  values: string[];
  operator: string;
}
