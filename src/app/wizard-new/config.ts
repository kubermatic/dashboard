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
  ProviderNDatacenter = 'Provider & Datacenter',
  ProviderSettings = 'Provider settings',
  NodeSettings = 'Node settings',
  Summary = 'Summary',
}

/**
 * Define all possible steps here.
 */
export let steps: WizardStep[] = [
  WizardStep.newWizardStep(StepRegistry.ProviderNDatacenter),
  WizardStep.newWizardStep(StepRegistry.Cluster),
  WizardStep.newWizardStep(StepRegistry.ProviderSettings),
  WizardStep.newWizardStep(StepRegistry.NodeSettings),
  WizardStep.newWizardStep(StepRegistry.Summary),
];
