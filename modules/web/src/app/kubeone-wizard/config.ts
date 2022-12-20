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

export class KubeOneWizardStep {
  name: string;
  enabled: boolean;

  constructor(name: string, enabled: boolean) {
    this.name = name;
    this.enabled = enabled;
  }

  get id(): string {
    return this.name.toLowerCase().replace(' ', '-');
  }

  static newWizardStep(name: string, enabled = true): KubeOneWizardStep {
    return new KubeOneWizardStep(name, enabled);
  }
}

export enum StepRegistry {
  Provider = 'Provider',
  Cluster = 'Cluster',
  Credentials = 'Credentials',
  Summary = 'Summary',
}

/**
 * Define all possible steps here.
 */
export const steps: KubeOneWizardStep[] = [
  KubeOneWizardStep.newWizardStep(StepRegistry.Provider),
  KubeOneWizardStep.newWizardStep(StepRegistry.Cluster),
  KubeOneWizardStep.newWizardStep(StepRegistry.Credentials),
  KubeOneWizardStep.newWizardStep(StepRegistry.Summary),
];
