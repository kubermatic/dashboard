import {Type} from '@angular/core';

export enum StepRegistry {
  Cluster = 'Cluster',
  Provider = 'Provider',
  Datacenter = 'Datacenter',
  Settings = 'Settings',
  Summary = 'Summary',
}

export class WizardStep {
  constructor(readonly name: string, readonly component: Type<any>, public required = true) {}

  get config(): {[key: string]: WizardStep} {
    return {[WizardStep.Controls.Config]: this};
  }
}

export namespace WizardStep {
  export enum Controls {
    // A form property that holds step config information
    Config = 'config',
  }
}
