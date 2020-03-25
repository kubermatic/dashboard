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
export let steps: WizardStep[] = [
  WizardStep.newWizardStep(StepRegistry.Provider),
  WizardStep.newWizardStep(StepRegistry.Cluster),
  WizardStep.newWizardStep(StepRegistry.ProviderSettings),
  WizardStep.newWizardStep(StepRegistry.NodeSettings),
  WizardStep.newWizardStep(StepRegistry.MachineNetwork, false),
  WizardStep.newWizardStep(StepRegistry.Summary),
];
