import {StepRegistry, WizardStep} from './step/step';

/**
 * Define all possible steps here.
 */
export let steps = [
  new WizardStep(StepRegistry.Cluster),
  new WizardStep(StepRegistry.Provider),
  new WizardStep(StepRegistry.Datacenter),
  new WizardStep(StepRegistry.Settings),
  new WizardStep(StepRegistry.Summary),
];
