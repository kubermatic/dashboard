import {ClusterStepComponent} from './step/cluster/component';
import {DatacenterStepComponent} from './step/datacenter/component';
import {MockStepComponent} from './step/mock/component';
import {ProviderStepComponent} from './step/provider/component';
import {SettingsStepComponent} from './step/settings/component';
import {StepRegistry, WizardStep} from './step/step';

/**
 * Define all possible steps here.
 */
export let steps = [
  new WizardStep(StepRegistry.Cluster, ClusterStepComponent),
  new WizardStep(StepRegistry.Provider, ProviderStepComponent),
  new WizardStep(StepRegistry.Datacenter, DatacenterStepComponent),
  new WizardStep(StepRegistry.Settings, SettingsStepComponent),
  new WizardStep(StepRegistry.Summary, MockStepComponent),
];
