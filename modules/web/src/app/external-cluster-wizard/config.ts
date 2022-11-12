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

export enum StepRegistry {
  Provider = 'Provider',
  Settings = 'Settings',
  ExternalClusterDetails = 'External Cluster Details',
  Summary = 'Summary',
}

export class ExternalClusterWizardStep {
  name: string;
  enabled: boolean;

  constructor(name: string, enabled: boolean) {
    this.name = name;
    this.enabled = enabled;
  }

  get id(): string {
    return this.name.toLowerCase().replace(/ /g, '-');
  }

  static newWizardStep(name: string, enabled = true): ExternalClusterWizardStep {
    return new ExternalClusterWizardStep(name, enabled);
  }
}

export const WizardSteps: ExternalClusterWizardStep[] = [
  ExternalClusterWizardStep.newWizardStep(StepRegistry.Provider),
  ExternalClusterWizardStep.newWizardStep(StepRegistry.Settings),
  ExternalClusterWizardStep.newWizardStep(StepRegistry.ExternalClusterDetails),
  ExternalClusterWizardStep.newWizardStep(StepRegistry.Summary),
];
