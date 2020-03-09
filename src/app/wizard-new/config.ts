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
  Cluster = 'Cluster',
  Provider = 'Provider',
  Datacenter = 'Datacenter',
  Settings = 'Settings',
  Summary = 'Summary',
}

/**
 * Define all possible steps here.
 */
export let steps: WizardStep[] = [
  WizardStep.newWizardStep(StepRegistry.Cluster),
  WizardStep.newWizardStep(StepRegistry.Provider),
  WizardStep.newWizardStep(StepRegistry.Datacenter),
  WizardStep.newWizardStep(StepRegistry.Settings),
  WizardStep.newWizardStep(StepRegistry.Summary),
];
