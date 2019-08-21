import {Type} from '@angular/core';

export class WizardStep {
  constructor(readonly name: string, readonly component: Type<any>, readonly required = true) {}

  get config(): {[key: string]: WizardStep} {
    return {config: this};
  }
}
