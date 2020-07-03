// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {NodeDataService} from '../../node-data-new/service/service';
import {NodeProvider, OperatingSystem} from '../../shared/model/NodeProviderConstants';
import {StepRegistry, WizardStep} from '../config';
import {ClusterService} from './cluster';

@Injectable()
export class WizardService {
  readonly stepsChanges = new EventEmitter<StepRegistry>();

  private _stepper: MatStepper;
  private _steps: WizardStep[];

  constructor(private readonly _clusterService: ClusterService, private readonly _nodeDataService: NodeDataService) {
    this._nodeDataService.operatingSystemChanges.subscribe(os => this._stepHandler.handleOSChange(os));
  }

  set provider(provider: NodeProvider) {
    this._stepHandler.handleProviderChange(provider);
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

  private _stepHandler = new (class {
    constructor(private _parent: WizardService) {}

    handleProviderChange(provider: NodeProvider): void {
      switch (provider) {
        case NodeProvider.BRINGYOUROWN:
          this._hideStep(StepRegistry.ProviderSettings);
          this._hideStep(StepRegistry.NodeSettings);
          this._hideStep(StepRegistry.MachineNetwork);
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
          this._hideStep(StepRegistry.MachineNetwork);
      }
    }

    handleOSChange(os: OperatingSystem): void {
      if (this._parent._clusterService.provider !== NodeProvider.VSPHERE) {
        this._hideStep(StepRegistry.MachineNetwork);
        return;
      }

      if (os !== OperatingSystem.ContainerLinux) {
        this._hideStep(StepRegistry.MachineNetwork);
        return;
      }

      this._showStep(StepRegistry.MachineNetwork);
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
  })(this);
}
