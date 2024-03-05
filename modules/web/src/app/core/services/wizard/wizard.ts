// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {EventEmitter, Injectable} from '@angular/core';
import {MatStepper} from '@angular/material/stepper';
import {StepRegistry, steps, WizardStep} from '@app/wizard/config';
import {ApplicationService} from '@core/services/application';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {NodeDataService} from '@core/services/node-data/service';
import {NodeProvider, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Injectable()
export class WizardService {
  readonly stepsChanges = new EventEmitter<StepRegistry>();

  private _stepper: MatStepper;
  private _steps: WizardStep[];
  private _unsubscribe = new Subject<void>();
  private _stepHandler = new (class {
    constructor(private _parent: WizardService) {}

    handleProviderChange(provider: NodeProvider): void {
      this._parent.steps = steps;
      switch (provider) {
        case NodeProvider.BRINGYOUROWN:
          this._hideStep(StepRegistry.ProviderSettings);
          this._hideStep(StepRegistry.NodeSettings);
          break;
        case NodeProvider.EDGE:
          this._hideStep(StepRegistry.ProviderSettings);
          this._showStep(StepRegistry.NodeSettings);
          break;
        default:
          this._showStep(StepRegistry.ProviderSettings);
          this._showStep(StepRegistry.NodeSettings);
      }
    }

    handleOSChange(_: OperatingSystem): void {
      if (this._parent._clusterSpecService.provider !== NodeProvider.VSPHERE) {
        this._hideStep(StepRegistry.MachineNetwork);
        return;
      }
    }

    private _hideStep(step: StepRegistry): void {
      this._parent.steps?.forEach((item, idx) => {
        if (item.name === step) {
          this._parent.steps[idx].enabled = false;
          this._parent.stepsChanges.emit(step);
        }
      });
    }

    private _showStep(step: StepRegistry): void {
      this._parent.steps?.forEach((item, idx) => {
        if (item.name === step) {
          this._parent.steps[idx].enabled = true;
          this._parent.stepsChanges.emit(step);
        }
      });
    }
  })(this);

  constructor(
    private readonly _clusterSpecService: ClusterSpecService,
    private readonly _nodeDataService: NodeDataService,
    private readonly applicationService: ApplicationService
  ) {
    this._nodeDataService.operatingSystemChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(os => this._stepHandler.handleOSChange(os));
  }

  get stepper(): MatStepper {
    return this._stepper;
  }

  set stepper(stepper: MatStepper) {
    this._stepper = stepper;
  }

  get steps(): WizardStep[] {
    return this._steps;
  }

  set steps(steps: WizardStep[]) {
    this._steps = steps;
  }

  set provider(provider: NodeProvider) {
    this._stepHandler.handleProviderChange(provider);
    this._clusterSpecService.provider = provider;
  }

  forceHandleProviderChange(provider: NodeProvider) {
    this._stepHandler.handleProviderChange(provider);
  }

  reset(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();

    this._clusterSpecService.reset();
    this._nodeDataService.reset();
    this.applicationService.reset();

    this._unsubscribe = new Subject<void>();
    this._monitorOSChange();
  }

  private _monitorOSChange(): void {
    this._nodeDataService.operatingSystemChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(os => this._stepHandler.handleOSChange(os));
  }
}
