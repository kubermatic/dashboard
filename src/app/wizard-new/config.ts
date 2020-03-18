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
  ProviderSettings = 'Provider settings',
  NodeSettings = 'Node settings',
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
  WizardStep.newWizardStep(StepRegistry.Summary),
];
