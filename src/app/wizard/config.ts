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

export class WizardStep {
  name: string;
  enabled: boolean;

  static newWizardStep(name: string, enabled = true): WizardStep {
    return {
      name,
      enabled,
    } as WizardStep;
  }
}

export enum StepRegistry {
  Provider = 'Provider',
  Cluster = 'Cluster',
  ProviderSettings = 'Settings',
  NodeSettings = 'Initial Nodes',
  MachineNetwork = 'Machine Network',
  Summary = 'Summary',
}

/**
 * Define all possible steps here.
 */
export const steps: WizardStep[] = [
  WizardStep.newWizardStep(StepRegistry.Provider),
  WizardStep.newWizardStep(StepRegistry.Cluster),
  WizardStep.newWizardStep(StepRegistry.ProviderSettings),
  WizardStep.newWizardStep(StepRegistry.NodeSettings),
  WizardStep.newWizardStep(StepRegistry.MachineNetwork, false),
  WizardStep.newWizardStep(StepRegistry.Summary),
];
