import {ClusterStepComponent} from './step/cluster/component';
import {DatacenterStepComponent} from './step/datacenter/component';
import {MockStepComponent} from './step/mock/component';
import {ProviderStepComponent} from './step/provider/component';
import {SettingsStepComponent} from './step/settings/component';
import {WizardStep} from './step/step';

/**
 * Define all possible steps here.
 */
export const steps = [
  new WizardStep('Cluster', ClusterStepComponent),
  new WizardStep('Provider', ProviderStepComponent),
  new WizardStep('Datacenter', DatacenterStepComponent),
  new WizardStep('Settings', SettingsStepComponent),
  new WizardStep('Summary', MockStepComponent),
];
