import {Type} from '@angular/core';

export class WizardStep {
  constructor(readonly name: string, readonly component: Type<any>, readonly required = true) {}

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
