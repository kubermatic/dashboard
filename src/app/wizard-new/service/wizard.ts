import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {Observable} from 'rxjs';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {StepRegistry, WizardStep} from '../step/step';
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

  get provider(): NodeProvider {
    return this._clusterService.provider;
  }

  set datacenter(datacenter: string) {
    this._clusterService.datacenter = datacenter;
  }

  get datacenter(): string {
    return this._clusterService.datacenter;
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

  get datacenterChanges(): Observable<string> {
    return this._clusterService.datacenterChanges;
  }

  get providerChanges(): Observable<NodeProvider> {
    return this._clusterService.providerChanges;
  }

  reset(): void {
    this._clusterService.reset();
  }

  private _stepHandler = new class {
    constructor(private _parent: WizardService) {}

    handleProviderStep(provider: NodeProvider): void {
      switch (provider) {
        case NodeProvider.BRINGYOUROWN:
          this._hideStep(StepRegistry.Settings);
          break;
        case NodeProvider.VSPHERE:
          // Change to show the additional network step
          this._showStep(StepRegistry.Summary);
          break;
        default:
          this._showStep(StepRegistry.Settings);
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
