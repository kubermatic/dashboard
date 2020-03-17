import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {StepRegistry, WizardStep} from '../config';
import {ClusterService} from './cluster';

@Injectable()
export class WizardService {
  readonly stepsChanges = new EventEmitter<StepRegistry>();

  private _stepper: MatStepper;
  private _steps: WizardStep[];

  constructor(private readonly _clusterService: ClusterService) {}

  set provider(provider: NodeProvider) {
    this._stepHandler.handleProviderStep(provider);
    this._clusterService.provider = provider;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  get stepper(): MatStepper {
    return this._stepper;
  }

  get steps(): WizardStep[] {
    return this._steps;
  }

  set steps(steps: WizardStep[]) {
    this._steps = steps;
  }

  reset(): void {
    this._clusterService.reset();
  }

  private _stepHandler = new class {
    constructor(private _parent: WizardService) {}

    handleProviderStep(provider: NodeProvider): void {
      switch (provider) {
        case NodeProvider.BRINGYOUROWN:
          this._hideStep(StepRegistry.ProviderSettings);
          this._hideStep(StepRegistry.NodeSettings);
          break;
        case NodeProvider.VSPHERE:
          // Change to show the additional network step
          this._showStep(StepRegistry.Summary);
          this._showStep(StepRegistry.ProviderSettings);
          this._showStep(StepRegistry.NodeSettings);
          break;
        default:
          this._showStep(StepRegistry.ProviderSettings);
          this._showStep(StepRegistry.NodeSettings);
      }
    }

    private _hideStep(step: StepRegistry): void {
      this._parent.steps.forEach((item, idx) => {
        if (item.name === step) {
          this._parent.steps[idx].enabled = false;
          this._parent.stepsChanges.emit(step);
        }
      });
    }

    private _showStep(step: StepRegistry): void {
      this._parent.steps.forEach((item, idx) => {
        if (item.name === step) {
          this._parent.steps[idx].enabled = true;
          this._parent.stepsChanges.emit(step);
        }
      });
    }
  }
  (this);
}
