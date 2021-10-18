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

import {Constraint, ConstraintTemplate, GatekeeperConfig, Violation} from '@shared/entity/opa';

export function fakeConstraintTemplates(): ConstraintTemplate[] {
  return [
    {
      name: 'k8sdenyname',
      spec: {
        crd: {
          spec: {
            names: {
              kind: 'K8sDenyName',
            },
            validation: {
              openAPIV3Schema: {
                properties: {
                  invalidName: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        targets: [
          {
            target: 'admission.k8s.gatekeeper.sh',
            rego: 'package k8sdenynames\nviolation[{"msg": msg}] {\n  input.review.object.metadata.name == input.parameters.invalidName\n  msg := sprintf("The name %v is not allowed", [input.parameters.invalidName])\n}\n',
          },
        ],
        selector: {
          labelSelector: {},
        },
      },
      status: {},
    },
    {
      name: 'k8srequiredlabels',
      spec: {
        crd: {
          spec: {
            names: {
              kind: 'K8sRequiredLabels',
            },
            validation: {
              openAPIV3Schema: {
                properties: {
                  labels: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
        targets: [
          {
            target: 'admission.k8s.gatekeeper.sh',
            rego: 'package k8srequiredlabels\nviolation[{"msg": msg, "details": {"missing_labels": missing}}] {\n  provided := {label | input.review.object.metadata.labels[label]}\n  required := {label | label := input.parameters.labels[_]}\n  missing := required - provided\n  count(missing) \u003e 0\n  msg := sprintf("you must provide labels: %v", [missing])\n}\n',
          },
        ],
        selector: {
          labelSelector: {},
        },
      },
      status: {},
    },
  ];
}

export function fakeConstraints(): Constraint[] {
  return [
    {
      name: 'denyNameConstraint',
      spec: {
        constraintType: 'K8sDenyName',
        match: {
          kinds: [
            {
              kinds: ['Namespace'],
              apiGroups: [''],
            },
          ],
          labelSelector: {},
          namespaceSelector: {},
        },
        parameters: {
          rawJSON: '{"labels":["gatekeeper"]}',
        },
      },
      status: {
        auditTimestamp: '2021-01-01T12:33:55Z',
      },
    },
    {
      name: 'reqLabelsConstraint',
      spec: {
        constraintType: 'K8sRequiredLabels',
        match: {
          kinds: [
            {
              kinds: ['Namespace'],
              apiGroups: [''],
            },
          ],
          labelSelector: {},
          namespaceSelector: {},
        },
        parameters: {
          rawJSON: '{"labels":["gatekeeper"]}',
        },
      },
      status: {
        auditTimestamp: '2021-01-01T12:33:55Z',
        violations: [
          {
            enforcementAction: 'deny',
            kind: 'Namespace',
            message: 'you must provide labels: {"gatekeeper"}',
            name: 'default',
          },
          {
            enforcementAction: 'deny',
            kind: 'Namespace',
            message: 'you must provide labels: {"gatekeeper"}',
            name: 'gatekeeper-system',
          },
        ],
      },
    },
  ];
}

export function fakeGatekeeperConfig(): GatekeeperConfig {
  return {
    spec: {
      sync: {
        syncOnly: [
          {
            group: 'extensions',
            version: 'v1',
            kind: 'Namespace',
          },
          {
            version: 'v1',
            kind: 'Pod',
          },
        ],
      },
      validation: {
        traces: [
          {
            user: 'user_to_trace@company.com',
            kind: {
              group: 'extensions',
              version: 'v1',
              kind: 'Namespace',
            },
            dump: 'All',
          },
          {
            user: 'user_to_trace2@company.com',
            kind: {
              version: 'v1',
              kind: 'Pod',
            },
            dump: 'All',
          },
        ],
      },
      match: [
        {
          excludedNamespaces: ['kube-system', 'gatekeeper-system'],
          processes: ['*'],
        },
        {
          excludedNamespaces: ['audit-excluded-ns'],
          processes: ['audit'],
        },
        {
          excludedNamespaces: ['audit-webhook-sync-excluded-ns'],
          processes: ['audit', 'webhook', 'sync'],
        },
      ],
      readiness: {
        statsEnabled: true,
      },
    },
  };
}

export function fakeViolations(): Violation[] {
  return [
    {
      enforcementAction: 'deny',
      kind: 'Namespace',
      message: 'you must provide labels: {"gatekeeper"}',
      name: 'default',
    },
    {
      enforcementAction: 'deny',
      kind: 'Namespace',
      message: 'you must provide labels: {"gatekeeper"}',
      name: 'gatekeeper-system',
    },
  ];
}
