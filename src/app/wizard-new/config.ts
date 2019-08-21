import {ClusterStepComponent} from './step/cluster/component';
import {MockStepComponent} from './step/mock/component';
import {WizardStep} from './step/step';

/**
 * Define all possible steps here.
 */
export const steps = [
  new WizardStep('Cluster', ClusterStepComponent),
  new WizardStep('Provider', MockStepComponent),
  new WizardStep('Datacenter', MockStepComponent),
  new WizardStep('Settings', MockStepComponent),
  new WizardStep('Summary', MockStepComponent),
];
