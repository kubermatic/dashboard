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

export class ExternalWizardStep {
  name: string;
  enabled: boolean;

  constructor(name: string, enabled: boolean) {
    this.name = name;
    this.enabled = enabled;
  }

  get id(): string {
    return this.name.toLowerCase().replace(' ', '-');
  }

  static newWizardStep(name: string, enabled = true): ExternalWizardStep {
    return new ExternalWizardStep(name, enabled);
  }
}

export enum StepRegistry {
  Provider = 'Provider',
  Credentials = 'Credentials',
  ClusterDetails = 'Cluster Details',
}

/**
 * Define all possible steps here.
 */
export const WizardSteps: ExternalWizardStep[] = [
  ExternalWizardStep.newWizardStep(StepRegistry.Provider),
  ExternalWizardStep.newWizardStep(StepRegistry.Credentials),
  ExternalWizardStep.newWizardStep(StepRegistry.ClusterDetails),
];
